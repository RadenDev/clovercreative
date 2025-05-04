// =============================================
// CHATBOT JASA LUKIS - VERSION FINAL
// =============================================

// Database Layanan
const services = {
    mural: {
      name: "Mural (Dinding/Tembok)",
      desc: "Lukisan permanen di dinding dengan cat khusus tahan lama",
      types: {
        pemandangan: { price: 300000, desc: "Lukisan pemandangan alam" },
        karakter: { price: 200000, desc: "Lukisan karakter/figur" },
        abstrak: { price: 300000, desc: "Karya seni abstrak" },
        "3D": { price: 350000, desc: "Efek 3D realistis" }
      },
      pricing: "Per m² (Panjang × Lebar)",
      minSize: "1×1 meter"
    },
    
    canvas: {
      name: "Lukisan Canvas",
      desc: "Karya seni di atas kanvas berkualitas",
      types: {
        pemandangan: { price: 2000, desc: "Pemandangan di kanvas" },
        karakter: { price: 1500, desc: "Potret di kanvas" },
        abstrak: { price: 250000, desc: "Karya abstrak" },
        "3D": { price: 3000, desc: "Efek 3D di kanvas" }
      },
      pricing: "Per cm² untuk ukuran >7×7cm",
      minSize: "7×7 cm"
    },
    
    custom: {
      name: "Custom (Barang Lain)",
      desc: "Lukisan di berbagai media sesuai permintaan",
      items: {
        sepatu: { price: 400000, desc: "Lukisan di sepatu" },
        tas: { price: 450000, desc: "Lukisan di tas" },
        helm: { price: 550000, desc: "Lukisan di helm" },
        lainnya: { price: 500000, desc: "Media lainnya" }
      },
      pricing: "Harga dasar + penyesuaian",
      minSize: "Tergantung barang"
    }
  };
  
  // Sistem Chatbot
  const ArtBot = {
    currentTopic: null,
    pendingData: {},
    
    // Daftar semua kata kunci yang diterima
    keywords: {
      services: ["mural", "canvas", "custom", "dinding", "tembok", "kanvas", "barang"],
      types: ["pemandangan", "karakter", "abstrak", "3d", "3D", "tiga dimensi"],
      actions: ["harga", "biaya", "berapa", "info", "detail", "jenis", "pengerjaan", "proses", "pesan", "order", "kontak"],
      others: ["ubah", "ganti", "topik", "batal", "reset", "help", "bantuan"]
    },
    
    // Pesan bantuan
    helpMessage: `🖌️ *PANDUAN KATA KUNCI* 🖌️
  
  1. **JENIS JASA** (wajib disebutkan):
     - Mural / Dinding
     - Canvas / Kanvas
     - Custom / Barang
  
  2. **JENIS LUKISAN**:
     - Pemandangan
     - Karakter
     - Abstrak
     - 3D
  
  3. **UKURAN** (format: angka x angka):
     - Contoh: 2x3 meter, 50x70 cm
  
  4. **PERINTAH**:
     - Harga / Biaya
     - Info / Detail
     - Proses / Pesan
     - Kontak
     - Ubah topik
  
  *Catatan*:
  - Tidak perlu kalimat lengkap, cukup kata kunci
  - Bisa gabung beberapa kata kunci
  - Contoh: "mural pemandangan 2x3m harga"`,
  
    // Normalisasi teks untuk handling typo
    normalizeText(text) {
      return text.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Hapus simbol
        .replace(/\s+/g, ' ') // Hapus spasi berlebih
        .trim();
    },
  
    // Deteksi kata kunci dalam pesan
    detectKeywords(text) {
      const normalized = this.normalizeText(text);
      const found = {
        service: null,
        type: null,
        action: null,
        size: null,
        item: null,
        other: null
      };
  
      // Deteksi service
      for (const [service, aliases] of Object.entries({
        mural: ['mural', 'dinding', 'tembok'],
        canvas: ['canvas', 'kanvas'],
        custom: ['custom', 'barang']
      })) {
        if (aliases.some(alias => normalized.includes(alias))) {
          found.service = service;
          break;
        }
      }
  
      // Deteksi type
      for (const type of this.keywords.types) {
        if (normalized.includes(type)) {
          found.type = type === '3d' ? '3D' : type;
          break;
        }
      }
  
      // Deteksi action
      for (const action of this.keywords.actions) {
        if (normalized.includes(action)) {
          found.action = action;
          break;
        }
      }
  
      // Deteksi size
      const sizeMatch = normalized.match(/(\d+)\s*x\s*(\d+)\s*(m|meter|cm)?/);
      if (sizeMatch) {
        found.size = {
          length: parseInt(sizeMatch[1]),
          width: parseInt(sizeMatch[2]),
          unit: sizeMatch[3] || (sizeMatch[0].includes('m') ? 'm' : 'cm')
        };
      }
  
      // Deteksi item custom
      if (found.service === 'custom') {
        for (const item of Object.keys(services.custom.items)) {
          if (normalized.includes(item)) {
            found.item = item;
            break;
          }
        }
      }
  
      // Deteksi other commands
      for (const other of this.keywords.others) {
        if (normalized.includes(other)) {
          found.other = other;
          break;
        }
      }
  
      return found;
    },
  
    // Handle perubahan topik
    handleTopicChange(request) {
      this.currentTopic = null;
      this.pendingData = {};
      return this.generateResponse(request);
    },
  
    // Generate response berdasarkan kata kunci
    generateResponse(userInput) {
      const input = this.normalizeText(userInput);
      const { service, type, action, size, item, other } = this.detectKeywords(input);
  
      // Handle permintaan bantuan
      if (input.includes('help') || input.includes('bantuan') || input === '?') {
        return this.helpMessage;
      }
  
      // Handle perubahan topik
      if (other && ['ubah', 'ganti', 'topik', 'batal', 'reset'].includes(other)) {
        return this.handleTopicChange(input);
      }
  
      // Jika tidak ada kata kunci yang dikenal
      if (!service && !action && !other) {
        return "Maaf, saya tidak mengenali permintaan Anda. Ketik 'help' untuk melihat panduan kata kunci.";
      }
  
      // Update context
      if (service) this.currentTopic = service;
      if (type) this.pendingData.type = type;
      if (size) this.pendingData.size = size;
      if (item) this.pendingData.item = item;
  
      // Handle berdasarkan action
      switch (action) {
        case 'harga':
        case 'biaya':
        case 'berapa':
          return this.handlePriceRequest();
        case 'info':
        case 'detail':
          return this.handleInfoRequest();
        case 'proses':
        case 'pesan':
          return this.handleOrderProcess();
        case 'kontak':
          return this.handleContactRequest();
        default:
          return this.handleGeneralRequest();
      }
    },
  
    // Handle permintaan harga
    handlePriceRequest() {
      if (!this.currentTopic) {
        return "Untuk menanyakan harga, sebutkan jenis jasanya (mural/canvas/custom).";
      }
  
      const service = services[this.currentTopic];
      let response = `💰 *PERKIRAAN HARGA* 💰\n\nJasa: ${service.name}\n`;
  
      if (this.currentTopic !== 'custom' && !this.pendingData.type) {
        return `Untuk menghitung harga ${this.currentTopic}, sebutkan jenis lukisannya (${Object.keys(service.types).join('/')}).`;
      }
  
      if (this.currentTopic !== 'custom' && !this.pendingData.size) {
        return `Untuk ${this.currentTopic} ${this.pendingData.type || ''}, sebutkan ukuran (contoh: 2x3 meter).`;
      }
  
      if (this.currentTopic === 'custom' && !this.pendingData.item) {
        return "Untuk custom, sebutkan barang yang ingin dilukis (sepatu/tas/helm/lainnya).";
      }
  
      // Hitung harga
      if (this.currentTopic === 'mural') {
        const area = this.pendingData.size.length * this.pendingData.size.width;
        const artPrice = area * service.types[this.pendingData.type].price;
        const servicePrice = area * 250000; // Jasa dinding
        
        response += `Jenis: ${this.pendingData.type}\n`;
        response += `Ukuran: ${this.pendingData.size.length}x${this.pendingData.size.width} m\n`;
        response += `- Lukisan: Rp${service.types[this.pendingData.type].price.toLocaleString()}/m² × ${area} m² = Rp${artPrice.toLocaleString()}\n`;
        response += `- Jasa Pasang: Rp250.000/m² × ${area} m² = Rp${servicePrice.toLocaleString()}\n`;
        response += `*Total: Rp${(artPrice + servicePrice).toLocaleString()}*`;
  
      } else if (this.currentTopic === 'canvas') {
        const area = this.pendingData.size.length * this.pendingData.size.width;
        const pricePerCm2 = service.types[this.pendingData.type].price;
        const totalPrice = area * pricePerCm2;
        
        response += `Jenis: ${this.pendingData.type}\n`;
        response += `Ukuran: ${this.pendingData.size.length}x${this.pendingData.size.width} cm\n`;
        response += `Harga: Rp${pricePerCm2.toLocaleString()}/cm² × ${area} cm² = Rp${totalPrice.toLocaleString()}\n`;
        response += `*Total: Rp${totalPrice.toLocaleString()}*`;
  
      } else if (this.currentTopic === 'custom') {
        const itemInfo = service.items[this.pendingData.item];
        response += `Barang: ${this.pendingData.item}\n`;
        response += `*Harga: Rp${itemInfo.price.toLocaleString()}*`;
      }
  
      response += "\n\n*Note*: Harga dapat berubah tergantung kompleksitas desain.";
      return response;
    },
  
    // Handle permintaan info
    handleInfoRequest() {
      if (!this.currentTopic) {
        let serviceList = "✏️ *DAFTAR JASA* ✏️\n\n";
        for (const [key, service] of Object.entries(services)) {
          serviceList += `- *${service.name}*: ${service.desc}\n`;
        }
        serviceList += "\nKetik 'mural', 'canvas', atau 'custom' untuk info detail.";
        return serviceList;
      }
  
      const service = services[this.currentTopic];
      let response = `ℹ️ *INFO ${service.name.toUpperCase()}* ℹ️\n\n`;
      response += `${service.desc}\n\n`;
  
      if (this.currentTopic !== 'custom') {
        response += `*Jenis Lukisan*:\n`;
        for (const [type, info] of Object.entries(service.types)) {
          response += `- ${type}: ${info.desc} (${services[this.currentTopic].pricing})\n`;
        }
        response += `\n*Ukuran Minimal*: ${service.minSize}\n`;
      } else {
        response += `*Barang yang Bisa Dilukis*:\n`;
        for (const [item, info] of Object.entries(service.items)) {
          response += `- ${item}: ${info.desc} (Rp${info.price.toLocaleString()})\n`;
        }
      }
  
      response += "\nContoh pertanyaan harga: ";
      if (this.currentTopic === 'mural') {
        response += "'mural pemandangan 2x3m harga'";
      } else if (this.currentTopic === 'canvas') {
        response += "'canvas 3D 50x70cm berapa'";
      } else {
        response += "'custom helm harga'";
      }
  
      return response;
    },
  
    // Handle proses pemesanan
    handleOrderProcess() {
      return `📋 *PROSES PEMESANAN* 📋\n\n1. Konsultasi desain (GRATIS)\n2. Pembayaran DP 50%\n3. Pengerjaan (kami update progress)\n4. Pelunasan & pengiriman\n\nUntuk mulai, bisa WA ke 0812-XXXX-XXXX atau ketik 'kontak' untuk info lebih lanjut.`;
    },
  
    // Handle kontak
    handleContactRequest() {
      return `📞 *KONTAK KAMI* 📞\n\nWhatsApp: 0812-XXXX-XXXX\nEmail: info@jasa-lukis.com\nStudio: Jl. Seni No. 123, Jakarta\n\nJam Operasional: Senin-Sabtu, 09.00-17.00 WIB`;
    },
  
    // Handle permintaan umum
    handleGeneralRequest() {
      if (this.currentTopic) {
        return `Anda sedang membahas ${services[this.currentTopic].name}. Mau tanya apa?\n- Harga\n- Info\n- Proses\n- Kontak\n\nAtau ketik 'ubah topik' untuk ganti bahasan.`;
      }
      return "Mau tanya tentang apa? (mural/canvas/custom)\nKetik 'help' untuk panduan.";
    }
  };
  
  // =============================================
  // FUNGSI UNTUK INTEGRASI DENGAN CHAT UI
  // =============================================
  
  // Fungsi untuk mengirim pesan
  function sendMessage() {
    const userInput = document.getElementById('user-input');
    const message = userInput.value.trim();
    
    if (message) {
      addMessage(message, true);
      userInput.value = '';
      
      // Beri jeda sebelum bot merespon
      setTimeout(() => {
        const response = ArtBot.generateResponse(message);
        addMessage(response);
      }, 500);
    }
  }
  
  // Fungsi untuk menambahkan pesan ke chat
  function addMessage(message, isUser = false) {
    const chatMessages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = isUser ? 'user-message' : 'bot-message';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = message.replace(/\n/g, '<br>');
    
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  // Event listeners
  document.getElementById('send-btn').addEventListener('click', sendMessage);
  document.getElementById('user-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
  
  // Pesan pembuka
  setTimeout(() => {
    addMessage("🎨 *Selamat datang di Jasa Lukis CloverArt* 🎨\n\n" + 
               "Saya ArtBot, asisten virtual Anda. Untuk mulai, ketik:\n" +
               "- 'mural' / 'canvas' / 'custom'\n" +
               "- 'help' untuk panduan pertanyaan lengkap\n\n" +
               "<b>NOTE: 'Disarankan untuk melihat panduan pertanyaan agar tidak terjadi kesalahan jawaban'</b>");
  }, 1000);