/**
 * Harwin connector part number decoder/encoder
 * Supports HRi, BBi, EZi, and Legacy series. Series-specific structures (e.g. 1005 differs between M80 and G125).
 */
class HarwinMaster {
  constructor() {
    this.series_info = {
      // —— HRi (High-Reliability) ——
      M80:  { name: "Datamate L-Tek/J-Tek",   pitch: "2.00mm",  range: "HRi", features: "Industry standard high-rel" },
      M83:  { name: "Datamate Mix-Tek",       pitch: "2.00mm",  range: "HRi", features: "Hybrid Power/Coax" },
      G125: { name: "Gecko",                 pitch: "1.25mm", range: "HRi", features: "45% smaller than Datamate; 2A/contact; screw-lock or latching" },
      M300: { name: "M300",                  pitch: "3.00mm", range: "HRi", features: "Rugged power; up to 10A per contact" },
      KA1:  { name: "Kona",                  pitch: "8.50mm", range: "HRi", features: "Ultra-high power; 60A/contact; individually shrouded pins" },
      // —— BBi (Board-to-Board & Industrial) ——
      M55:  { name: "Archer Kontrol",         pitch: "1.27mm",  range: "BBi", features: "Shrouded, polarized; 3Gbit/s data" },
      M50:  { name: "Archer Connectors",     pitch: "1.27mm",  range: "BBi", features: "Industrial headers/sockets" },
      M52:  { name: "Archer Connectors",     pitch: "1.27mm",  range: "BBi", features: "Industrial headers/sockets" },
      M05:  { name: "Archer .5",             pitch: "0.50mm",  range: "BBi", features: "Ultra-fine pitch mezzanine" },
      M08:  { name: "Archer .8",             pitch: "0.80mm",  range: "BBi", features: "High-speed mezzanine; up to 28Gbit/s" },
      M225: { name: "M225 Series",            pitch: "2.00mm",  range: "BBi", features: "Rugged industrial; 10G vibration resistance" },
      FL:   { name: "Flecto",                pitch: "—",      range: "BBi", features: "Floating; ±0.5mm X/Y/Z movement" },
      // —— EZi (Board-Level Hardware) ——
      EMI:  { name: "EMI/RFI Shielding",      pitch: "—",      range: "EZi", features: "SMT shield clips and cans" },
      SMT:  { name: "SMT Spring Contacts",    pitch: "—",      range: "EZi", features: "Shield fingers, grounding contacts" },
      SYC:  { name: "Sycamore Contacts",     pitch: "—",      range: "EZi", features: "Three-point SMT sockets" },
      PCB:  { name: "PCB Hardware",         pitch: "—",      range: "EZi", features: "Spacers, standoffs, test points, coin cell holders" },
      CLIP: { name: "Cable Management",      pitch: "—",      range: "EZi", features: "SMT cable clips" },
      // —— Legacy & Commercial ——
      M20:  { name: "M20",                   pitch: "2.54mm (0.1\")", range: "Legacy", features: "Headers and sockets" },
      M22:  { name: "M22",                   pitch: "2.00mm",  range: "Legacy", features: "Headers and sockets" },
      M40:  { name: "M40",                   pitch: "1.00mm",  range: "Legacy", features: "Headers and sockets" },
      HS:   { name: "HotShoe",                pitch: "—",      range: "Legacy", features: "Spring-loaded battery/charging; docking" },
    };
  }

  _seriesFromPart(part) {
    const m = part.match(/^(M80|M83|G125|M300|KA1|M55|M50|M52|M05|M08|M225|M20|M22|M40)(?:-|$)/i);
    if (m) return m[1].toUpperCase();
    if (part.startsWith("FL")) return "FL";
    if (/^(EMI|SMT|SYC|PCB|CLIP)/i.test(part)) return part.substring(0, 3).toUpperCase();
    if (/^HS/i.test(part)) return "HS";
    const prefix = part.match(/^[A-Z][0-9]{2,3}/);
    return prefix ? prefix[0] : null;
  }

  decode(part_num) {
    const part = String(part_num).toUpperCase().trim();
    const series = this._seriesFromPart(part);
    if (!series) return { error: "Invalid format: could not identify series" };
    const info = this.series_info[series];
    if (!info) return { error: "Unknown series: " + series };

    const result = {
      part: part,
      series: info.name,
      pitch: info.pitch,
      range: info.range,
      features: {},
    };

    if (series === "M80") return this._decode_m80(part, result);
    if (series === "M83") return this._decode_m83(part, result);
    if (series === "G125") return this._decode_g125(part, result);
    if (series === "M55") return this._decode_m55(part, result);
    if (series === "M300") return this._decode_m300(part, result);
    if (series === "KA1") return this._decode_ka1(part, result);
    if (series === "M50" || series === "M52") return this._decode_m50_m52(part, result);
    if (series === "M225") return this._decode_m225(part, result);
    if (series === "M20" || series === "M22" || series === "M40") return this._decode_legacy_m20_m22_m40(part, result);

    result.features.note = "Part structure varies; see Harwin datasheet for full breakdown.";
    return result;
  }

  /** M80 Datamate: Short form M80-5102042 = gender(5/8), style(10/20/40), contact count, finish.
   *  Extended form M80-4000000F2-03-PF5-00-000 has contact count in first segment after base, e.g. -03- = 3 contacts.
   *  Short form only when the 7-digit block is followed by end or hyphen (not a letter like F). */
  _decode_m80(part, res) {
    const shortPattern = /M80-([4-8])(\d{2})(\d{2,3})(\d{2})(?=$|-)/;
    const shortMatch = part.match(shortPattern);
    if (shortMatch) {
      var gender = shortMatch[1], style = shortMatch[2], count = shortMatch[3], finish = shortMatch[4];
      res.features.gender = "45".indexOf(gender) >= 0 ? "Male" : "Female";
      res.features.contacts = parseInt(count, 10);
      var styles = { "10": "Vertical Through-hole", "20": "SMT", "40": "Crimp" };
      res.features.mounting = styles[style] || "Specialized";
      var finishes = { "42": "Gold/Tin", "05": "All Gold", "22": "Selective Gold" };
      res.features.plating = finishes[finish] || "Standard";
      return res;
    }
    // Extended form: contact count in first numeric segment after base (e.g. -03- or -3-).
    const extendedMatch = part.match(/M80-[^-]+-(\d{1,2})-/);
    if (extendedMatch) {
      res.features.contacts = parseInt(extendedMatch[1], 10);
      const firstDigit = part.match(/M80-([4-8])/);
      if (firstDigit) res.features.gender = "45".indexOf(firstDigit[1]) >= 0 ? "Male" : "Female";
    }
    return res;
  }

  /** M83 Datamate Mix-Tek: same structure as M80; hybrid power/coax. */
  _decode_m83(part, res) {
    var pattern = /M83-([4-8])(\d{2})(\d{2,3})(\d{2})/;
    var match = part.match(pattern);
    if (match) {
      var gender = match[1], style = match[2], count = match[3], finish = match[4];
      res.features.gender = "45".indexOf(gender) >= 0 ? "Male" : "Female";
      res.features.contacts = parseInt(count, 10);
      res.features.mounting = { "10": "Vertical", "20": "SMT", "40": "Crimp" }[style] || "Specialized";
      res.features.plating = { "42": "Gold/Tin", "05": "All Gold", "22": "Selective Gold" }[finish] || "Standard";
      res.features.type = "Hybrid Power/Coax";
    }
    return res;
  }

  /** G125 Gecko: structure differs from M80. e.g. G125-FV11005L0R — F/M, V/S, contact code (e.g. 11 005 = 11 contacts); 1005 here is NOT style+count like M80. */
  _decode_g125(part, res) {
    if (part.indexOf("FV") >= 0 || part.indexOf("FS") >= 0) res.features.gender = "Female";
    else if (part.indexOf("MV") >= 0 || part.indexOf("MS") >= 0) res.features.gender = "Male";
    if (part.indexOf("V") >= 0 || part.indexOf("S") >= 0) res.features.termination = part.indexOf("V") >= 0 ? "Vertical" : "SMT (S)";
    var countMatch = part.match(/(\d{2})05/);
    if (countMatch) res.features.contacts = parseInt(countMatch[1], 10);
    if (part.indexOf("L") >= 0) res.features.latch = "Latching";
    res.features.plating = "Gold (0.2–0.3µm typical)";
    return res;
  }

  /** M55 Archer Kontrol: M55-6xxxxxx (6=Female, 7=Male); height, contact count, finish. */
  _decode_m55(part, res) {
    res.features.gender = part.indexOf("-6") >= 0 ? "Female" : "Male";
    var heightCode = (part.match(/M55-[67](\d)/) || [])[1] || "";
    var heights = { "0": "6.25mm", "1": "9.05mm", "2": "13.65mm" };
    res.features.height_profile = heights[heightCode] || "Standard";
    var cnt = part.match(/M55-[67]\d(\d{2})/);
    if (cnt) res.features.contacts = parseInt(cnt[1], 10);
    return res;
  }

  _decode_m300(part, res) {
    var m = part.match(/M300-?(\d+)/);
    if (m) res.features.contact_code = m[1];
    res.features.current = "Up to 10A per contact";
    return res;
  }

  _decode_ka1(part, res) {
    var m = part.match(/KA1-?(\w+)/);
    if (m) res.features.variant = m[1];
    res.features.current = "60A per contact";
    return res;
  }

  _decode_m50_m52(part, res) {
    var m = part.match(/(M50|M52)-?(\d+)/);
    if (m) res.features.variant_or_pins = m[2];
    return res;
  }

  _decode_m225(part, res) {
    var m = part.match(/M225-?(\w+)/);
    if (m) res.features.variant = m[1];
    res.features.vibration = "10G resistance";
    return res;
  }

  _decode_legacy_m20_m22_m40(part, res) {
    var m = part.match(/(M20|M22|M40)-?(\d+)/);
    if (m) res.features.pins_or_variant = m[2];
    return res;
  }

  encode(series, gender, contacts, style) {
    var g = String(gender || "").toLowerCase();
    var c = parseInt(contacts, 10) || 0;
    var s = String(style || "vertical").toLowerCase();

    if (series === "M80") {
      var prefix = g === "male" ? "5" : "8";
      var styleCode = s === "smt" ? "20" : s === "crimp" ? "40" : "10";
      var count = c < 10 ? "0" + c : String(c);
      return "M80-" + prefix + styleCode + count + "42";
    }
    if (series === "M83") {
      var prefix = g === "male" ? "5" : "8";
      var styleCode = s === "smt" ? "20" : "10";
      var count = c < 10 ? "0" + c : String(c);
      return "M83-" + prefix + styleCode + count + "42";
    }
    if (series === "M55") {
      var prefix = g === "male" ? "7" : "6";
      var count = c < 10 ? "0" + c : String(c);
      return "M55-" + prefix + "00" + count + "42R";
    }
    if (series === "G125") {
      var pre = g === "male" ? "MV" : "FV";
      var count = c < 10 ? "0" + c : String(c);
      return "G125-" + pre + count + "05L0R";
    }
    if (series === "M300") return "M300-" + (c < 10 ? "0" + c : c) + "xxxx";
    if (series === "KA1") return "KA1-" + (c < 10 ? "0" + c : c) + "xxx";
    if (series === "M50" || series === "M52") return series + "-" + c;
    if (series === "M225") return "M225-" + c + "xxx";
    if (series === "M20" || series === "M22" || series === "M40") return series + "-" + c;
    return "Encoding not available for this series; use Harwin catalog or configurator.";
  }
}

window.HarwinMaster = HarwinMaster;
window.harwinMaster = new HarwinMaster();
