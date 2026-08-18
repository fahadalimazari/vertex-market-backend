const mongoose = require('mongoose');

const mongoURI = 'mongodb://127.0.0.1:27017/vertexmarket';

const Category = mongoose.model('Category', new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true },
  status: { type: String, default: 'Active' },
  isDeleted: { type: Boolean, default: false },
  displayOrder: { type: Number, default: 0 }
}, { timestamps: true }));

const SubCategory = mongoose.model('SubCategory', new mongoose.Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  name: { type: String, required: true },
  slug: { type: String, required: true },
  status: { type: String, default: 'Active' },
  isDeleted: { type: Boolean, default: false },
  displayOrder: { type: Number, default: 0 }
}, { timestamps: true }));

const Attribute = mongoose.model('Attribute', new mongoose.Schema({
  subCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory' },
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  attributeGroup: { type: String, default: 'General' },
  dataType: { type: String, default: 'Text' },
  inputType: { type: String, default: 'Text Field' },
  required: { type: Boolean, default: false },
  status: { type: String, default: 'Active' },
  isDeleted: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 }
}, { timestamps: true }));

const AttributeValue = mongoose.model('AttributeValue', new mongoose.Schema({
  attributeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Attribute' },
  value: { type: String, required: true },
  label: { type: String, required: true },
  status: { type: String, default: 'Active' },
  isDeleted: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 }
}, { timestamps: true }));

const dataToSeed = [
  {
    category: "Beauty & Health",
    subs: [
      {
        name: "Fragrances",
        attributes: [
          { name: "Brand", code: "frag_brand", type: "Dropdown", required: true, options: ["Gucci", "Chanel", "Dior", "Versace"] },
          { name: "Fragrance Type", code: "frag_type", type: "Dropdown", options: ["Eau de Parfum", "Eau de Toilette", "Parfum", "Cologne"] },
          { name: "Gender", code: "frag_gender", type: "Dropdown", options: ["Men", "Women", "Unisex"] },
          { name: "Size / Volume", code: "frag_size", type: "Text Field" },
          { name: "Concentration", code: "frag_concentration", type: "Dropdown", options: ["High", "Medium", "Low"] },
          { name: "Fragrance Family", code: "frag_family", type: "Dropdown", options: ["Floral", "Woody", "Oriental", "Fresh"] },
          { name: "Scent Notes", code: "frag_notes", type: "Multi Select", options: ["Citrus", "Vanilla", "Musk", "Rose", "Sandalwood"] },
          { name: "Country of Origin", code: "frag_country", type: "Dropdown", options: ["France", "Italy", "USA", "UK"] }
        ]
      }
    ]
  },
  {
    category: "Computers",
    subs: [
      {
        name: "Desktops",
        attributes: [
          { name: "Brand", code: "desk_brand", type: "Dropdown", options: ["Dell", "HP", "Lenovo", "Apple", "Asus", "Acer"] },
          { name: "Processor", code: "desk_proc", type: "Dropdown", options: ["Intel Core i3", "Intel Core i5", "Intel Core i7", "Intel Core i9", "AMD Ryzen 3", "AMD Ryzen 5", "AMD Ryzen 7", "AMD Ryzen 9", "Apple M1", "Apple M2"] },
          { name: "Processor Generation", code: "desk_proc_gen", type: "Dropdown", options: ["10th Gen", "11th Gen", "12th Gen", "13th Gen", "14th Gen"] },
          { name: "RAM", code: "desk_ram", type: "Dropdown", options: ["4 GB", "8 GB", "16 GB", "32 GB", "64 GB"] },
          { name: "RAM Type", code: "desk_ram_type", type: "Dropdown", options: ["DDR4", "DDR5"] },
          { name: "Storage Type", code: "desk_storage_type", type: "Dropdown", options: ["SSD", "HDD", "SSD + HDD"] },
          { name: "Storage Capacity", code: "desk_storage_cap", type: "Dropdown", options: ["256 GB", "512 GB", "1 TB", "2 TB"] },
          { name: "Graphics Card", code: "desk_gpu", type: "Dropdown", options: ["Integrated", "NVIDIA GTX 1650", "NVIDIA RTX 3050", "NVIDIA RTX 3060", "NVIDIA RTX 4060", "NVIDIA RTX 4070", "NVIDIA RTX 4090"] },
          { name: "Graphics Memory", code: "desk_gpu_mem", type: "Dropdown", options: ["2 GB", "4 GB", "6 GB", "8 GB", "12 GB", "16 GB", "24 GB"] },
          { name: "Operating System", code: "desk_os", type: "Dropdown", options: ["Windows 10", "Windows 11", "macOS", "Linux", "DOS"] },
          { name: "Power Supply", code: "desk_psu", type: "Text Field" },
          { name: "Warranty", code: "desk_warranty", type: "Text Field" }
        ]
      },
      {
        name: "Monitors",
        attributes: [
          { name: "Brand", code: "mon_brand", type: "Dropdown", options: ["Dell", "HP", "LG", "Samsung", "Asus", "Acer", "BenQ"] },
          { name: "Screen Size", code: "mon_size", type: "Dropdown", options: ["22 inch", "24 inch", "27 inch", "32 inch", "34 inch Ultrawide"] },
          { name: "Resolution", code: "mon_res", type: "Dropdown", options: ["1920 x 1080 (FHD)", "2560 x 1440 (QHD)", "3840 x 2160 (4K)"] },
          { name: "Panel Type", code: "mon_panel", type: "Dropdown", options: ["IPS", "VA", "TN", "OLED"] },
          { name: "Refresh Rate", code: "mon_refresh", type: "Dropdown", options: ["60 Hz", "75 Hz", "144 Hz", "165 Hz", "240 Hz"] },
          { name: "Response Time", code: "mon_response", type: "Text Field" },
          { name: "Aspect Ratio", code: "mon_aspect", type: "Dropdown", options: ["16:9", "21:9", "32:9"] },
          { name: "Brightness", code: "mon_bright", type: "Text Field" },
          { name: "Ports", code: "mon_ports", type: "Multi Select", options: ["HDMI", "DisplayPort", "USB-C", "VGA"] },
          { name: "Adaptive Sync", code: "mon_sync", type: "Dropdown", options: ["FreeSync", "G-Sync", "None"] },
          { name: "HDR", code: "mon_hdr", type: "Dropdown", options: ["HDR10", "DisplayHDR 400", "None"] },
          { name: "Warranty", code: "mon_warranty", type: "Text Field" }
        ]
      },
      {
        name: "Components",
        attributes: [
          { name: "Component Type", code: "comp_type", type: "Dropdown", options: ["Processor", "Graphics Card", "RAM", "SSD", "HDD", "Motherboard", "Power Supply", "PC Case", "Cooling"] },
          { name: "Brand", code: "comp_brand", type: "Text Field" },
          { name: "Model", code: "comp_model", type: "Text Field" },
          { name: "Compatibility", code: "comp_compat", type: "Text Field" },
          { name: "Interface", code: "comp_interface", type: "Text Field" },
          { name: "Capacity", code: "comp_capacity", type: "Text Field" },
          { name: "Speed", code: "comp_speed", type: "Text Field" },
          { name: "Power Requirement", code: "comp_power", type: "Text Field" },
          { name: "Warranty", code: "comp_warranty", type: "Text Field" }
        ]
      },
      {
        name: "Networking",
        attributes: [
          { name: "Device Type", code: "net_type", type: "Dropdown", options: ["Router", "Switch", "Access Point", "Network Adapter", "Modem", "Mesh System"] },
          { name: "Brand", code: "net_brand", type: "Dropdown", options: ["TP-Link", "Netgear", "Asus", "D-Link", "Cisco", "Ubiquiti"] },
          { name: "Model", code: "net_model", type: "Text Field" },
          { name: "Wi-Fi Standard", code: "net_wifi", type: "Dropdown", options: ["Wi-Fi 4", "Wi-Fi 5", "Wi-Fi 6", "Wi-Fi 6E", "Wi-Fi 7"] },
          { name: "Wireless Speed", code: "net_speed", type: "Text Field" },
          { name: "Ethernet Speed", code: "net_eth", type: "Dropdown", options: ["10/100 Mbps", "Gigabit (10/100/1000 Mbps)", "2.5 Gigabit", "10 Gigabit"] },
          { name: "Number of Ports", code: "net_ports", type: "Text Field" },
          { name: "Frequency", code: "net_freq", type: "Dropdown", options: ["2.4 GHz", "5 GHz", "Dual Band", "Tri Band"] },
          { name: "Antennas", code: "net_antennas", type: "Text Field" },
          { name: "Security", code: "net_sec", type: "Multi Select", options: ["WPA", "WPA2", "WPA3", "WEP"] },
          { name: "Connectivity", code: "net_conn", type: "Text Field" },
          { name: "Warranty", code: "net_warranty", type: "Text Field" }
        ]
      },
      {
        name: "Gaming Laptops",
        attributes: [
          { name: "Brand", code: "glap_brand", type: "Dropdown", options: ["Asus", "Acer", "MSI", "Lenovo", "HP", "Dell", "Razer"] },
          { name: "Processor", code: "glap_proc", type: "Dropdown", options: ["Intel Core i5", "Intel Core i7", "Intel Core i9", "AMD Ryzen 5", "AMD Ryzen 7", "AMD Ryzen 9"] },
          { name: "Processor Generation", code: "glap_proc_gen", type: "Dropdown", options: ["11th Gen", "12th Gen", "13th Gen", "14th Gen"] },
          { name: "RAM", code: "glap_ram", type: "Dropdown", options: ["8 GB", "16 GB", "32 GB", "64 GB"] },
          { name: "Storage Type", code: "glap_storage_type", type: "Dropdown", options: ["SSD"] },
          { name: "Storage Capacity", code: "glap_storage_cap", type: "Dropdown", options: ["512 GB", "1 TB", "2 TB"] },
          { name: "Graphics Card", code: "glap_gpu", type: "Dropdown", options: ["NVIDIA RTX 3050", "NVIDIA RTX 4050", "NVIDIA RTX 4060", "NVIDIA RTX 4070", "NVIDIA RTX 4080", "NVIDIA RTX 4090", "AMD Radeon RX"] },
          { name: "Graphics Memory", code: "glap_gpu_mem", type: "Dropdown", options: ["4 GB", "6 GB", "8 GB", "12 GB", "16 GB"] },
          { name: "Screen Size", code: "glap_size", type: "Dropdown", options: ["14 inch", "15.6 inch", "16 inch", "17.3 inch", "18 inch"] },
          { name: "Resolution", code: "glap_res", type: "Dropdown", options: ["1920 x 1080 (FHD)", "2560 x 1440 (QHD)", "3840 x 2160 (4K)"] },
          { name: "Refresh Rate", code: "glap_refresh", type: "Dropdown", options: ["120 Hz", "144 Hz", "165 Hz", "240 Hz", "300 Hz+"] },
          { name: "Panel Type", code: "glap_panel", type: "Dropdown", options: ["IPS", "OLED", "Mini-LED"] },
          { name: "Operating System", code: "glap_os", type: "Dropdown", options: ["Windows 11 Home", "Windows 11 Pro", "DOS"] },
          { name: "Battery Capacity", code: "glap_batt", type: "Text Field" },
          { name: "Warranty", code: "glap_warranty", type: "Text Field" }
        ]
      }
    ]
  },
  {
    category: "Electronics",
    subs: [
      {
        name: "Laptops",
        attributes: [
          { name: "Brand", code: "lap_brand", type: "Dropdown", options: ["Apple", "Dell", "HP", "Lenovo", "Asus", "Acer", "Samsung"] },
          { name: "Processor", code: "lap_proc", type: "Dropdown", options: ["Intel Core i3", "Intel Core i5", "Intel Core i7", "AMD Ryzen 3", "AMD Ryzen 5", "AMD Ryzen 7", "Apple M1", "Apple M2", "Apple M3"] },
          { name: "Processor Generation", code: "lap_proc_gen", type: "Dropdown", options: ["11th Gen", "12th Gen", "13th Gen", "14th Gen"] },
          { name: "RAM", code: "lap_ram", type: "Dropdown", options: ["4 GB", "8 GB", "16 GB", "32 GB"] },
          { name: "Storage Type", code: "lap_storage_type", type: "Dropdown", options: ["SSD", "HDD", "eMMC"] },
          { name: "Storage Capacity", code: "lap_storage_cap", type: "Dropdown", options: ["128 GB", "256 GB", "512 GB", "1 TB", "2 TB"] },
          { name: "Graphics Card", code: "lap_gpu", type: "Dropdown", options: ["Integrated", "Dedicated"] },
          { name: "Screen Size", code: "lap_size", type: "Dropdown", options: ["13.3 inch", "14 inch", "15.6 inch", "16 inch", "17.3 inch"] },
          { name: "Resolution", code: "lap_res", type: "Dropdown", options: ["1366 x 768 (HD)", "1920 x 1080 (FHD)", "2560 x 1600 (QHD)", "3840 x 2160 (4K)"] },
          { name: "Operating System", code: "lap_os", type: "Dropdown", options: ["Windows 10", "Windows 11", "macOS", "Chrome OS", "DOS"] },
          { name: "Battery Capacity", code: "lap_batt", type: "Text Field" },
          { name: "Weight", code: "lap_weight", type: "Text Field" },
          { name: "Warranty", code: "lap_warranty", type: "Text Field" }
        ]
      },
      {
        name: "Gaming Consoles",
        attributes: [
          { name: "Brand", code: "cons_brand", type: "Dropdown", options: ["Sony", "Microsoft", "Nintendo"] },
          { name: "Model", code: "cons_model", type: "Dropdown", options: ["PlayStation 5", "PlayStation 4", "Xbox Series X", "Xbox Series S", "Xbox One", "Nintendo Switch", "Nintendo Switch OLED"] },
          { name: "Console Type", code: "cons_type", type: "Dropdown", options: ["Home Console", "Handheld", "Hybrid"] },
          { name: "Storage Capacity", code: "cons_storage", type: "Dropdown", options: ["512 GB", "825 GB", "1 TB", "2 TB"] },
          { name: "Resolution", code: "cons_res", type: "Dropdown", options: ["1080p", "1440p", "4K", "8K"] },
          { name: "Maximum FPS", code: "cons_fps", type: "Dropdown", options: ["60 FPS", "120 FPS"] },
          { name: "Controller Included", code: "cons_ctrl_inc", type: "Dropdown", options: ["Yes", "No"] },
          { name: "Number of Controllers", code: "cons_ctrl_num", type: "Text Field" },
          { name: "Connectivity", code: "cons_conn", type: "Multi Select", options: ["Wi-Fi", "Bluetooth", "Ethernet", "HDMI"] },
          { name: "Optical Drive", code: "cons_drive", type: "Dropdown", options: ["Yes (Disc Edition)", "No (Digital Edition)"] },
          { name: "Region", code: "cons_region", type: "Dropdown", options: ["Global", "US", "UK", "Japan", "UAE"] },
          { name: "Warranty", code: "cons_warranty", type: "Text Field" }
        ]
      },
      {
        name: "Cameras",
        attributes: [
          { name: "Brand", code: "cam_brand", type: "Dropdown", options: ["Canon", "Nikon", "Sony", "Fujifilm", "Panasonic", "GoPro"] },
          { name: "Camera Type", code: "cam_type", type: "Dropdown", options: ["DSLR", "Mirrorless", "Compact", "Action Camera", "Instant Camera", "Camcorder"] },
          { name: "Model", code: "cam_model", type: "Text Field" },
          { name: "Sensor Type", code: "cam_sensor", type: "Dropdown", options: ["Full Frame", "APS-C", "Micro Four Thirds", "1 inch"] },
          { name: "Sensor Size", code: "cam_sensor_size", type: "Text Field" },
          { name: "Megapixels", code: "cam_mp", type: "Text Field" },
          { name: "Lens Mount", code: "cam_mount", type: "Text Field" },
          { name: "Video Resolution", code: "cam_video", type: "Dropdown", options: ["1080p", "4K", "5.3K", "6K", "8K"] },
          { name: "Maximum FPS", code: "cam_fps", type: "Text Field" },
          { name: "ISO Range", code: "cam_iso", type: "Text Field" },
          { name: "Image Stabilization", code: "cam_is", type: "Dropdown", options: ["In-body (IBIS)", "Lens-based", "Digital", "None"] },
          { name: "Connectivity", code: "cam_conn", type: "Multi Select", options: ["Wi-Fi", "Bluetooth", "NFC", "HDMI", "USB-C"] },
          { name: "Warranty", code: "cam_warranty", type: "Text Field" }
        ]
      },
      {
        name: "Audio",
        attributes: [
          { name: "Audio Type", code: "aud_type", type: "Dropdown", options: ["Headphones", "Earbuds", "Speakers", "Soundbar", "Microphone", "Home Audio"] },
          { name: "Brand", code: "aud_brand", type: "Dropdown", options: ["Sony", "Bose", "JBL", "Sennheiser", "Apple", "Samsung", "Skullcandy", "Logitech"] },
          { name: "Model", code: "aud_model", type: "Text Field" },
          { name: "Connectivity", code: "aud_conn", type: "Dropdown", options: ["Wired", "Wireless (Bluetooth)", "True Wireless", "USB"] },
          { name: "Wireless", code: "aud_wireless", type: "Dropdown", options: ["Yes", "No"] },
          { name: "Battery Life", code: "aud_battery", type: "Text Field" },
          { name: "Driver Size", code: "aud_driver", type: "Text Field" },
          { name: "Frequency Response", code: "aud_freq", type: "Text Field" },
          { name: "Noise Cancellation", code: "aud_anc", type: "Dropdown", options: ["Active Noise Cancellation (ANC)", "Passive", "None"] },
          { name: "Microphone", code: "aud_mic", type: "Dropdown", options: ["Built-in", "Detachable", "None"] },
          { name: "Water Resistance", code: "aud_water", type: "Dropdown", options: ["IPX4", "IPX5", "IPX7", "IP67", "None"] },
          { name: "Warranty", code: "aud_warranty", type: "Text Field" }
        ]
      }
    ]
  },
  {
    category: "Fashion",
    subs: [
      {
        name: "Men's Shoes",
        attributes: [
          { name: "Brand", code: "fshoe_brand", type: "Dropdown", options: ["Nike", "Adidas", "Puma", "Reebok", "Bata", "Clarks", "Vans"] },
          { name: "Shoe Type", code: "fshoe_type", type: "Dropdown", options: ["Sneakers", "Running", "Formal", "Casual", "Boots", "Sandals", "Slippers"] },
          { name: "Size", code: "fshoe_size", type: "Dropdown", options: ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11", "UK 12"] },
          { name: "Color", code: "fshoe_color", type: "Dropdown", options: ["Black", "White", "Brown", "Blue", "Red", "Grey", "Multi"] },
          { name: "Material", code: "fshoe_mat", type: "Dropdown", options: ["Leather", "Synthetic", "Canvas", "Mesh", "Suede"] },
          { name: "Sole Material", code: "fshoe_sole", type: "Dropdown", options: ["Rubber", "EVA", "PU", "TPR"] },
          { name: "Closure Type", code: "fshoe_closure", type: "Dropdown", options: ["Lace-Up", "Slip-On", "Velcro", "Zip"] },
          { name: "Pattern", code: "fshoe_pattern", type: "Dropdown", options: ["Solid", "Striped", "Colorblock", "Printed"] },
          { name: "Country of Origin", code: "fshoe_origin", type: "Text Field" }
        ]
      }
    ]
  },
  {
    category: "Gaming",
    subs: []
  },
  {
    category: "Men's Fashion",
    subs: [
      {
        name: "Clothing",
        attributes: [
          { name: "Brand", code: "mcloth_brand", type: "Dropdown", options: ["Levis", "Zara", "H&M", "Polo Ralph Lauren", "Tommy Hilfiger", "Calvin Klein", "Adidas", "Nike"] },
          { name: "Clothing Type", code: "mcloth_type", type: "Dropdown", options: ["T-Shirt", "Shirt", "Polo", "Jeans", "Trousers", "Jacket", "Hoodie", "Sweater", "Shorts", "Suit"] },
          { name: "Size", code: "mcloth_size", type: "Dropdown", options: ["XS", "S", "M", "L", "XL", "XXL", "3XL", "28", "30", "32", "34", "36", "38", "40"] },
          { name: "Color", code: "mcloth_color", type: "Dropdown", options: ["Black", "White", "Blue", "Navy", "Grey", "Red", "Green", "Yellow", "Brown", "Multi"] },
          { name: "Material", code: "mcloth_mat", type: "Dropdown", options: ["Cotton", "Polyester", "Denim", "Linen", "Wool", "Blend"] },
          { name: "Fit", code: "mcloth_fit", type: "Dropdown", options: ["Regular Fit", "Slim Fit", "Skinny Fit", "Relaxed Fit", "Oversized"] },
          { name: "Pattern", code: "mcloth_pattern", type: "Dropdown", options: ["Solid", "Striped", "Checkered", "Printed", "Graphic"] },
          { name: "Sleeve Type", code: "mcloth_sleeve", type: "Dropdown", options: ["Short Sleeve", "Long Sleeve", "Sleeveless", "3/4 Sleeve"] },
          { name: "Neck Type", code: "mcloth_neck", type: "Dropdown", options: ["Round Neck", "V-Neck", "Polo Neck", "Henley", "Collared"] },
          { name: "Care Instructions", code: "mcloth_care", type: "Text Field" },
          { name: "Country of Origin", code: "mcloth_origin", type: "Text Field" }
        ]
      },
      {
        name: "Shoes",
        attributes: [
          { name: "Brand", code: "mshoe_brand", type: "Dropdown", options: ["Nike", "Adidas", "Puma", "Reebok", "Bata", "Clarks", "Vans"] },
          { name: "Shoe Type", code: "mshoe_type", type: "Dropdown", options: ["Sneakers", "Running", "Formal", "Casual", "Boots", "Sandals", "Slippers"] },
          { name: "Size", code: "mshoe_size", type: "Dropdown", options: ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11", "UK 12"] },
          { name: "Color", code: "mshoe_color", type: "Dropdown", options: ["Black", "White", "Brown", "Blue", "Red", "Grey", "Multi"] },
          { name: "Material", code: "mshoe_mat", type: "Dropdown", options: ["Leather", "Synthetic", "Canvas", "Mesh", "Suede"] },
          { name: "Sole Material", code: "mshoe_sole", type: "Dropdown", options: ["Rubber", "EVA", "PU", "TPR"] },
          { name: "Closure Type", code: "mshoe_closure", type: "Dropdown", options: ["Lace-Up", "Slip-On", "Velcro", "Zip"] },
          { name: "Pattern", code: "mshoe_pattern", type: "Dropdown", options: ["Solid", "Striped", "Colorblock", "Printed"] },
          { name: "Country of Origin", code: "mshoe_origin", type: "Text Field" }
        ]
      },
      {
        name: "Watches",
        attributes: [
          { name: "Brand", code: "mwatch_brand", type: "Dropdown", options: ["Casio", "Rolex", "Seiko", "Fossil", "Citizen", "Tommy Hilfiger", "Tissot"] },
          { name: "Watch Type", code: "mwatch_type", type: "Dropdown", options: ["Analog", "Digital", "Smart Watch", "Chronograph", "Automatic"] },
          { name: "Movement", code: "mwatch_mov", type: "Dropdown", options: ["Quartz", "Mechanical", "Automatic", "Solar"] },
          { name: "Strap Material", code: "mwatch_strap", type: "Dropdown", options: ["Stainless Steel", "Leather", "Resin", "Silicone", "Nylon"] },
          { name: "Case Material", code: "mwatch_case", type: "Dropdown", options: ["Stainless Steel", "Resin", "Brass", "Titanium"] },
          { name: "Case Size", code: "mwatch_size", type: "Text Field" },
          { name: "Dial Color", code: "mwatch_dial", type: "Dropdown", options: ["Black", "White", "Blue", "Silver", "Gold"] },
          { name: "Display Type", code: "mwatch_disp", type: "Dropdown", options: ["Analog", "Digital", "Analog-Digital"] },
          { name: "Water Resistance", code: "mwatch_water", type: "Dropdown", options: ["30m", "50m", "100m", "200m", "None"] },
          { name: "Features", code: "mwatch_features", type: "Multi Select", options: ["Date Display", "Chronograph", "Alarm", "Backlight", "Luminous Hands"] },
          { name: "Warranty", code: "mwatch_warranty", type: "Text Field" }
        ]
      }
    ]
  },
  {
    category: "Mobiles & Tablets",
    subs: [
      {
        name: "Smartphones",
        attributes: [
          { name: "Brand", code: "sm_brand", type: "Dropdown", options: ["Apple", "Samsung", "Xiaomi", "OnePlus", "Vivo", "Oppo", "Realme", "Google"] },
          { name: "Model", code: "sm_model", type: "Text Field" },
          { name: "RAM", code: "sm_ram", type: "Dropdown", options: ["2 GB", "3 GB", "4 GB", "6 GB", "8 GB", "12 GB", "16 GB"] },
          { name: "Storage Capacity", code: "sm_storage", type: "Dropdown", options: ["32 GB", "64 GB", "128 GB", "256 GB", "512 GB", "1 TB"] },
          { name: "Display Size", code: "sm_size", type: "Dropdown", options: ["Under 6 inch", "6.0 - 6.4 inch", "6.5 - 6.7 inch", "Over 6.7 inch"] },
          { name: "Display Type", code: "sm_dtype", type: "Dropdown", options: ["IPS LCD", "OLED", "AMOLED", "Super AMOLED", "Dynamic AMOLED"] },
          { name: "Resolution", code: "sm_res", type: "Dropdown", options: ["HD+", "FHD+", "QHD+", "4K"] },
          { name: "Refresh Rate", code: "sm_ref", type: "Dropdown", options: ["60 Hz", "90 Hz", "120 Hz", "144 Hz"] },
          { name: "Processor", code: "sm_proc", type: "Dropdown", options: ["Snapdragon", "MediaTek", "Apple A-Series", "Exynos", "Google Tensor"] },
          { name: "Rear Camera", code: "sm_rcam", type: "Text Field" },
          { name: "Front Camera", code: "sm_fcam", type: "Text Field" },
          { name: "Battery Capacity", code: "sm_batt", type: "Text Field" },
          { name: "Operating System", code: "sm_os", type: "Dropdown", options: ["Android", "iOS"] },
          { name: "5G Support", code: "sm_5g", type: "Dropdown", options: ["Yes", "No"] },
          { name: "SIM Type", code: "sm_sim", type: "Dropdown", options: ["Single SIM", "Dual SIM", "eSIM Supported"] },
          { name: "Fast Charging", code: "sm_fast", type: "Dropdown", options: ["Yes", "No"] },
          { name: "Warranty", code: "sm_warranty", type: "Text Field" }
        ]
      },
      {
        name: "Tablets",
        attributes: [
          { name: "Brand", code: "tab_brand", type: "Dropdown", options: ["Apple", "Samsung", "Lenovo", "Xiaomi", "Realme"] },
          { name: "Model", code: "tab_model", type: "Text Field" },
          { name: "RAM", code: "tab_ram", type: "Dropdown", options: ["3 GB", "4 GB", "6 GB", "8 GB", "16 GB"] },
          { name: "Storage Capacity", code: "tab_storage", type: "Dropdown", options: ["32 GB", "64 GB", "128 GB", "256 GB", "512 GB", "1 TB", "2 TB"] },
          { name: "Display Size", code: "tab_size", type: "Dropdown", options: ["8 inch", "10 inch", "11 inch", "12.9 inch", "14.6 inch"] },
          { name: "Display Type", code: "tab_dtype", type: "Dropdown", options: ["IPS LCD", "Liquid Retina", "OLED", "Super AMOLED"] },
          { name: "Resolution", code: "tab_res", type: "Text Field" },
          { name: "Refresh Rate", code: "tab_ref", type: "Dropdown", options: ["60 Hz", "90 Hz", "120 Hz"] },
          { name: "Processor", code: "tab_proc", type: "Dropdown", options: ["Apple M-Series", "Apple A-Series", "Snapdragon", "MediaTek"] },
          { name: "Rear Camera", code: "tab_rcam", type: "Text Field" },
          { name: "Front Camera", code: "tab_fcam", type: "Text Field" },
          { name: "Battery Capacity", code: "tab_batt", type: "Text Field" },
          { name: "Operating System", code: "tab_os", type: "Dropdown", options: ["iPadOS", "Android", "Windows"] },
          { name: "Cellular Connectivity", code: "tab_cell", type: "Dropdown", options: ["Wi-Fi Only", "Wi-Fi + Cellular (4G/LTE)", "Wi-Fi + 5G"] },
          { name: "SIM Support", code: "tab_sim", type: "Dropdown", options: ["Nano-SIM", "eSIM", "Both", "None"] },
          { name: "Fast Charging", code: "tab_fast", type: "Dropdown", options: ["Yes", "No"] },
          { name: "Warranty", code: "tab_warranty", type: "Text Field" }
        ]
      },
      {
        name: "Accessories",
        attributes: [
          { name: "Accessory Type", code: "acc_type", type: "Dropdown", options: ["Charger", "Cable", "Power Bank", "Phone Case", "Screen Protector", "Car Mount", "Adapter", "Wireless Charger", "Earphones"] },
          { name: "Brand", code: "acc_brand", type: "Text Field" },
          { name: "Compatibility", code: "acc_compat", type: "Text Field" },
          { name: "Material", code: "acc_mat", type: "Text Field" },
          { name: "Color", code: "acc_color", type: "Text Field" },
          { name: "Connectivity", code: "acc_conn", type: "Text Field" },
          { name: "Model Compatibility", code: "acc_mod_compat", type: "Text Field" },
          { name: "Warranty", code: "acc_warranty", type: "Text Field" }
        ]
      },
      {
        name: "Wearables",
        attributes: [
          { name: "Brand", code: "wear_brand", type: "Dropdown", options: ["Apple", "Samsung", "Garmin", "Fitbit", "Xiaomi", "Amazfit", "Huawei"] },
          { name: "Device Type", code: "wear_type", type: "Dropdown", options: ["Smart Watch", "Fitness Band", "Smart Ring"] },
          { name: "Model", code: "wear_model", type: "Text Field" },
          { name: "Display Type", code: "wear_dtype", type: "Dropdown", options: ["OLED", "AMOLED", "LCD", "MIP"] },
          { name: "Display Size", code: "wear_size", type: "Text Field" },
          { name: "Battery Life", code: "wear_batt", type: "Text Field" },
          { name: "Connectivity", code: "wear_conn", type: "Multi Select", options: ["Bluetooth", "Wi-Fi", "Cellular (LTE/5G)", "NFC"] },
          { name: "Water Resistance", code: "wear_water", type: "Dropdown", options: ["IP67", "IP68", "5 ATM", "10 ATM", "None"] },
          { name: "Compatibility", code: "wear_compat", type: "Dropdown", options: ["iOS Only", "Android Only", "iOS & Android"] },
          { name: "Sensors", code: "wear_sens", type: "Multi Select", options: ["Heart Rate", "SpO2", "ECG", "Temperature", "Altimeter", "Compass"] },
          { name: "GPS", code: "wear_gps", type: "Dropdown", options: ["Built-in", "Connected GPS", "None"] },
          { name: "Warranty", code: "wear_warranty", type: "Text Field" }
        ]
      },
      {
        name: "Mobile Parts",
        attributes: [
          { name: "Part Type", code: "mpart_type", type: "Dropdown", options: ["Display", "Battery", "Camera Module", "Charging Port", "Speaker", "Motherboard", "Back Cover", "Button/Flex Cable"] },
          { name: "Brand", code: "mpart_brand", type: "Text Field" },
          { name: "Model Compatibility", code: "mpart_compat", type: "Text Field" },
          { name: "Device Compatibility", code: "mpart_dev", type: "Text Field" },
          { name: "Condition", code: "mpart_cond", type: "Dropdown", options: ["New", "Refurbished", "Used", "Pulled"] },
          { name: "Part Number", code: "mpart_pnum", type: "Text Field" },
          { name: "Warranty", code: "mpart_warranty", type: "Text Field" }
        ]
      }
    ]
  },
  {
    category: "TV & Appliances",
    subs: []
  }
];

function slugify(text) {
  return text.toLowerCase().replace(/[\s&]+/g, '-').replace(/[^\w-]+/g, '');
}

(async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to DB. Starting migration...');

    // 1. Delete all existing data
    await Category.deleteMany({});
    await SubCategory.deleteMany({});
    await Attribute.deleteMany({});
    await AttributeValue.deleteMany({});
    console.log('Cleared existing Categories, SubCategories, Attributes, and AttributeValues.');

    // 2. Seed data
    let catOrder = 1;
    for (const catData of dataToSeed) {
      const category = await Category.create({
        name: catData.category,
        slug: slugify(catData.category),
        displayOrder: catOrder++
      });
      
      let subOrder = 1;
      for (const subData of catData.subs) {
        const subCategory = await SubCategory.create({
          categoryId: category._id,
          name: subData.name,
          slug: slugify(subData.name),
          displayOrder: subOrder++
        });
        
        if (subData.attributes) {
          let attrOrder = 1;
          for (const attrData of subData.attributes) {
            const attribute = await Attribute.create({
              subCategoryId: subCategory._id,
              name: attrData.name,
              code: attrData.code,
              inputType: attrData.type,
              required: attrData.required || false,
              sortOrder: attrOrder++
            });
            
            if (attrData.options && (attrData.type === 'Dropdown' || attrData.type === 'Multi Select')) {
              let valOrder = 1;
              for (const opt of attrData.options) {
                await AttributeValue.create({
                  attributeId: attribute._id,
                  value: opt,
                  label: opt,
                  sortOrder: valOrder++
                });
              }
            }
          }
        }
      }
    }
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
})();
