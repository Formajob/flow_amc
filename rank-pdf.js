(function (root) {
  const WIDTHS = {
    " ": 278, ".": 278, ",": 278, "-": 333, "'": 191, ":": 278, ";": 278, "/": 278,
    "(": 333, ")": 333, "+": 584, "0": 556, "1": 556, "2": 556, "3": 556, "4": 556,
    "5": 556, "6": 556, "7": 556, "8": 556, "9": 556,
    "A": 667, "B": 667, "C": 722, "D": 722, "E": 667, "F": 611, "G": 778, "H": 722, "I": 278, "J": 500,
    "K": 667, "L": 556, "M": 833, "N": 722, "O": 778, "P": 667, "Q": 778, "R": 722, "S": 667, "T": 611,
    "U": 722, "V": 667, "W": 944, "X": 667, "Y": 667, "Z": 611,
    "a": 556, "b": 556, "c": 500, "d": 556, "e": 556, "f": 278, "g": 556, "h": 556, "i": 222, "j": 222,
    "k": 500, "l": 222, "m": 833, "n": 556, "o": 556, "p": 556, "q": 556, "r": 333, "s": 500, "t": 278,
    "u": 556, "v": 500, "w": 722, "x": 500, "y": 500, "z": 500
  };
  const NAVY = "0.043 0.075 0.188";
  const INK = "0.094 0.129 0.231";
  const MUTED = "0.384 0.439 0.541";
  const CYAN = "0.149 0.831 0.918";
  const GOLD = "0.788 0.635 0.153";
  const LINE = "0.894 0.910 0.945";
  const PAPER = "0.965 0.969 0.984";

  function ascii(s) {
    const out = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i) & 255;
    return out;
  }
  function concat(parts) {
    let n = 0;
    parts.forEach((p) => { n += p.length; });
    const out = new Uint8Array(n);
    let o = 0;
    parts.forEach((p) => { out.set(p, o); o += p.length; });
    return out;
  }
  function winAnsi(text) {
    const src = String(text)
      .replace(/\u2019|\u2018/g, "'")
      .replace(/\u2013|\u2014/g, "-")
      .replace(/\u2026/g, "...")
      .replace(/\u0153/g, "oe")
      .replace(/\u0152/g, "OE")
      .replace(/\u00a0/g, " ");
    const out = [];
    for (const ch of src) {
      const c = ch.codePointAt(0);
      if (c >= 32 && c <= 126) out.push(c);
      else if (c >= 160 && c <= 255) out.push(c);
      else out.push(63);
    }
    return out;
  }
  function pdfString(text) {
    const bytes = winAnsi(text);
    const out = [40];
    bytes.forEach((b) => {
      if (b === 40 || b === 41 || b === 92) out.push(92, b);
      else if (b < 32) {
        const oct = b.toString(8).padStart(3, "0");
        out.push(92, oct.charCodeAt(0), oct.charCodeAt(1), oct.charCodeAt(2));
      } else out.push(b);
    });
    out.push(41);
    return out;
  }
  function measure(text, size, bold) {
    let n = 0;
    winAnsi(text).forEach((b) => {
      const ch = String.fromCharCode(b);
      n += WIDTHS[ch] || WIDTHS[ch.toLowerCase()] || 500;
    });
    return (n / 1000) * size * (bold ? 1.08 : 1);
  }
  function wrap(text, size, width, bold) {
    const words = String(text).split(/\s+/);
    const lines = [];
    let cur = "";
    words.forEach((word) => {
      const next = cur ? cur + " " + word : word;
      if (cur && measure(next, size, bold) > width) {
        lines.push(cur);
        cur = word;
      } else cur = next;
    });
    if (cur) lines.push(cur);
    return lines;
  }
  function ordinal(n) {
    return n === 1 ? "1er" : n + "e";
  }
  function num(n) {
    const v = Number(n) || 0;
    const neg = v < 0;
    const fixed = (Math.round(Math.abs(v) * 100) / 100).toFixed(2);
    const parts = fixed.split(".");
    const whole = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    const frac = parts[1].replace(/0+$/, "");
    return (neg ? "-" : "") + whole + (frac ? "," + frac : "");
  }

  function Doc() {
    this.parts = [];
    this.objects = [];
  }
  Doc.prototype.add = function (body) {
    this.objects.push(body);
    return this.objects.length;
  };
  Doc.prototype.bytes = function () {
    const head = ascii("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
    const chunks = [head];
    const offsets = [0];
    let pos = head.length;
    this.objects.forEach((body, i) => {
      offsets.push(pos);
      const chunk = concat([ascii((i + 1) + " 0 obj\n"), body, ascii("\nendobj\n")]);
      chunks.push(chunk);
      pos += chunk.length;
    });
    const startxref = pos;
    let xref = "xref\n0 " + (this.objects.length + 1) + "\n0000000000 65535 f \n";
    for (let i = 1; i < offsets.length; i++) xref += String(offsets[i]).padStart(10, "0") + " 00000 n \n";
    xref += "trailer\n<< /Size " + (this.objects.length + 1) + " /Root 1 0 R >>\nstartxref\n" + startxref + "\n%%EOF";
    chunks.push(ascii(xref));
    return concat(chunks);
  };

  function streamObject(dict, data) {
    return concat([ascii(dict + "\nstream\n"), data, ascii("\nendstream")]);
  }
  function pageObject(parent, contentId, imageId) {
    const extra = imageId ? " /XObject << /Im1 " + imageId + " 0 R >>" : "";
    return ascii("<< /Type /Page /Parent " + parent + " 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 3 0 R /F2 4 0 R >>" + extra + " >> /Contents " + contentId + " 0 R >>");
  }

  function Painter(image) {
    this.ops = [];
    this.image = image || null;
  }
  Painter.prototype.cmd = function (s) { this.ops.push(ascii(s + "\n")); };
  Painter.prototype.fill = function (x, y, w, h, color) {
    this.cmd(color + " rg\n" + x.toFixed(2) + " " + y.toFixed(2) + " " + w.toFixed(2) + " " + h.toFixed(2) + " re f");
  };
  Painter.prototype.stroke = function (x, y, w, h, color, width) {
    this.cmd(color + " RG\n" + (width || 1).toFixed(2) + " w\n" + x.toFixed(2) + " " + y.toFixed(2) + " " + w.toFixed(2) + " " + h.toFixed(2) + " re S");
  };
  Painter.prototype.line = function (x1, y1, x2, y2, color, width) {
    this.cmd(color + " RG\n" + (width || 0.6).toFixed(2) + " w\n" + x1.toFixed(2) + " " + y1.toFixed(2) + " m " + x2.toFixed(2) + " " + y2.toFixed(2) + " l S");
  };
  Painter.prototype.text = function (x, y, text, size, bold, color) {
    const font = bold ? "F2" : "F1";
    this.ops.push(ascii("BT\n/" + font + " " + size + " Tf\n" + color + " rg\n" + x.toFixed(2) + " " + y.toFixed(2) + " Td\n"));
    this.ops.push(pdfString(text));
    this.ops.push(ascii(" Tj\nET\n"));
  };
  Painter.prototype.center = function (cx, y, text, size, bold, color) {
    this.text(cx - measure(text, size, bold) / 2, y, text, size, bold, color);
  };
  Painter.prototype.right = function (rx, y, text, size, bold, color) {
    this.text(rx - measure(text, size, bold), y, text, size, bold, color);
  };
  Painter.prototype.paragraph = function (x, y, text, size, width, leading, color) {
    const lines = wrap(text, size, width, false);
    lines.forEach((line, i) => this.text(x, y - i * leading, line, size, false, color));
    return y - lines.length * leading;
  };
  Painter.prototype.logo = function (x, y, w) {
    if (!this.image) return;
    const h = w * (this.image.h / this.image.w);
    this.cmd("q\n" + w.toFixed(2) + " 0 0 " + h.toFixed(2) + " " + x.toFixed(2) + " " + y.toFixed(2) + " cm\n/Im1 Do\nQ");
    return h;
  };
  Painter.prototype.bytes = function () { return concat(this.ops); };

  function finish(pages, image) {
    const doc = new Doc();
    doc.add(ascii("<< /Type /Catalog /Pages 2 0 R >>"));
    doc.add(ascii("<< /Type /Pages /Count 0 /Kids [] >>"));
    const font1 = doc.add(ascii("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"));
    const font2 = doc.add(ascii("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"));
    if (font1 !== 3 || font2 !== 4) throw new Error("font ids");
    let imageId = 0;
    if (image && image.bytes) {
      imageId = doc.add(streamObject("<< /Type /XObject /Subtype /Image /Width " + image.w + " /Height " + image.h + " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + image.bytes.length + " >>", image.bytes));
    }
    const pageIds = [];
    const contentIds = pages.map((page) => doc.add(streamObject("<< /Length " + page.length + " >>", page)));
    const pagesId = 2;
    contentIds.forEach((id) => pageIds.push(doc.add(pageObject(pagesId, id, imageId))));
    doc.objects[1] = ascii("<< /Type /Pages /Count " + pageIds.length + " /Kids [" + pageIds.map((id) => id + " 0 R").join(" ") + "] >>");
    return doc.bytes();
  }

  function headerBand(p, title) {
    p.fill(0, 770, 595.28, 72, NAVY);
    p.fill(0, 766, 595.28, 4, CYAN);
    if (p.image) p.logo(36, 786, 148);
    else p.text(36, 796, "ACX Flow", 16, true, "1 1 1");
    p.right(560, 804, "Espace AMC", 9, true, CYAN);
    p.right(560, 788, title, 8, false, "0.84 0.89 0.95");
  }

  function assocBlock(p, y) {
    p.text(40, y, "Association Morocco's Creativity", 12, true, NAVY);
    p.text(40, y - 16, "Caravane humanitaire, 11e édition", 10, false, INK);
    p.text(40, y - 30, "Douar Ilissi, région d'Azilal  ·  26 et 27 décembre 2026", 10, false, INK);
    p.text(40, y - 46, "support@acx.ma  ·  flow.acx.ma  ·  +212 634 232 006", 9, false, MUTED);
    return y - 82;
  }

  function reportPdf(model, image) {
    const pages = [];
    let p = new Painter(image);
    let y = 742;
    function newPage(continued) {
      if (p) pages.push(p.bytes());
      p = new Painter(image);
      if (continued) {
        p.fill(0, 806, 595.28, 36, NAVY);
        p.text(36, 820, "ACX Flow  ·  Espace AMC", 9, true, "1 1 1");
        p.right(560, 820, "Rapport de classement", 8, false, CYAN);
        y = 784;
      } else {
        headerBand(p, "Rapport de classement");
        y = assocBlock(p, 742);
      }
    }
    function need(h) {
      if (y - h < 48) newPage(true);
    }
    newPage(false);
    pages.pop();
    p.text(40, y, "Rapport de classement", 18, true, NAVY);
    p.text(40, y - 18, "Extrait le " + model.dateLabel + " depuis ACX Flow", 9, false, MUTED);
    p.text(40, y - 32, "50 MAD = 1 pt · 10 vêtements = 1 pt · 5 livres = 1 pt.", 8, false, MUTED);
    p.text(40, y - 42, "Couvertures, par personne : 3 pts chacune pour les 3 premières, puis 4 pts dès la 4e.", 8, false, MUTED);
    p.text(40, y - 52, "1er et 2e panier : 3 pts chacun, puis 4 · Panier 2 : 2 pts · Tri : 5 pts · Déplacement : 1 pt.", 8, false, MUTED);
    y -= 68;
    p.fill(40, y - 8, 515, 22, PAPER);
    p.text(48, y, "Cinq groupes", 9, true, NAVY);
    p.text(150, y, num(model.pieces) + " pièces", 9, false, INK);
    p.text(270, y, num(model.money) + " MAD", 9, false, INK);
    p.text(400, y, num(model.points) + " points", 9, false, INK);
    y -= 34;
    need(28);
    p.text(40, y, "Classement des groupes", 12, true, NAVY);
    y -= 18;
    p.fill(40, y - 6, 515, 18, NAVY);
    p.text(48, y, "Rang", 8, true, "1 1 1");
    p.text(88, y, "Groupe", 8, true, "1 1 1");
    p.text(168, y, "Tête de groupe", 8, true, "1 1 1");
    p.right(390, y, "Pièces", 8, true, "1 1 1");
    p.right(455, y, "Dons", 8, true, "1 1 1");
    p.right(508, y, "Points", 8, true, "1 1 1");
    p.right(548, y, "Part", 8, true, "1 1 1");
    y -= 20;
    model.groups.forEach((g, i) => {
      need(18);
      if (i % 2 === 0) p.fill(40, y - 5, 515, 16, PAPER);
      p.text(48, y, ordinal(g.rank), 9, true, NAVY);
      p.text(88, y, g.label, 9, true, INK);
      p.text(168, y, g.leader.name, 9, false, INK);
      p.right(390, y, num(g.pieces), 9, false, INK);
      p.right(455, y, num(g.money), 9, false, INK);
      p.right(508, y, num(g.score), 9, true, NAVY);
      p.right(548, y, g.percent + " %", 9, false, MUTED);
      y -= 16;
    });
    y -= 16;
    model.groups.forEach((g) => {
      need(128);
      p.text(40, y, g.label + "  ·  " + ordinal(g.rank) + " au classement", 12, true, NAVY);
      p.text(280, y, g.percent + " % de la part du groupe", 9, false, MUTED);
      y -= 8;
      p.line(40, y, 555, y, LINE, 0.6);
      y -= 16;
      g.members.forEach((m) => {
        need(16);
        p.text(48, y, ordinal(m.rank), 9, true, m.rank === 1 ? GOLD : MUTED);
        p.text(88, y, m.name, 9, m.rank === 1, INK);
        p.right(390, y, num(m.pieces) + " pcs", 9, false, INK);
        p.right(470, y, num(m.money) + " MAD", 9, false, INK);
        p.right(548, y, num(m.score) + " pts", 9, true, NAVY);
        y -= 14;
      });
      y -= 8;
    });
    need(28);
    p.paragraph(40, y, "Document établi par ACX Flow pour l'Association Morocco's Creativity. Les chiffres sont ceux des saisies enregistrées à la date d'extraction. Ils peuvent être extraits à nouveau à la fin de la collecte.", 8, 515, 11, MUTED);
    pages.push(p.bytes());
    pages.forEach((bytes, i) => {
      const painter = bytes;
      const mark = ascii("BT\n/F1 8 Tf\n" + MUTED + " rg\n520 28 Td\n");
      const label = pdfString("Page " + (i + 1) + " / " + pages.length);
      pages[i] = concat([painter, mark, label, ascii(" Tj\nET\n")]);
    });
    return finish(pages, image);
  }

  function certificatePdf(person, model, image) {
    const p = new Painter(image);
    p.stroke(18, 18, 559.28, 805.89, NAVY, 1.4);
    p.stroke(24, 24, 547.28, 793.89, GOLD, 0.7);
    p.fill(36, 736, 523.28, 58, NAVY);
    p.fill(36, 732, 523.28, 3, CYAN);
    if (p.image) p.logo(48, 750, 132);
    else p.text(48, 758, "ACX Flow", 14, true, "1 1 1");
    p.right(544, 766, "Espace AMC", 8, true, CYAN);
    p.right(544, 752, "Attestation", 8, false, "0.84 0.89 0.95");
    p.center(297, 702, "Association Morocco's Creativity", 12, true, NAVY);
    p.center(297, 686, "Caravane humanitaire, 11e édition", 9, false, INK);
    p.center(297, 672, "Douar Ilissi, région d'Azilal  ·  26 et 27 décembre 2026", 9, false, MUTED);
    p.line(120, 656, 475, 656, GOLD, 0.8);
    p.center(297, 628, "ATTESTATION DE PERFORMANCE", 13, true, NAVY);
    p.center(297, 600, "L'association atteste que", 11, false, MUTED);
    p.fill(70, 536, 455, 48, PAPER);
    p.center(297, 554, person.name, 22, true, NAVY);
    const quiet = person.score === 0 && person.groupQuiet;
    const lead = quiet
      ? person.name + " est la tête de liste affichée du " + person.groupLabel + ". Aucune saisie n'est encore enregistrée pour ce groupe à la date de ce document."
      : person.name + " est en tête du " + person.groupLabel + ", " + ordinal(person.groupRank) + " au classement général, d'après les saisies enregistrées dans ACX Flow.";
    let y = p.paragraph(70, 508, lead, 11, 455, 15, INK);
    y -= 8;
    const boxes = [
      ["Points", num(person.score)],
      ["Pièces", num(person.pieces)],
      ["Dons, MAD", num(person.money)]
    ];
    boxes.forEach((box, i) => {
      const x = 70 + i * 154;
      p.stroke(x, y - 46, 146, 52, LINE, 0.8);
      p.text(x + 12, y - 8, box[0], 8, false, MUTED);
      p.text(x + 12, y - 30, box[1], 16, true, NAVY);
    });
    y -= 70;
    p.text(70, y, "Rang dans le groupe : 1er", 10, false, INK);
    p.text(300, y, "Part du groupe : " + person.groupPercent + " %", 10, false, INK);
    y -= 16;
    p.text(70, y, "Points du groupe : " + num(person.groupScore), 10, false, INK);
    y -= 22;
    p.text(70, y, "Référence  " + person.ref, 9, true, NAVY);
    p.text(70, y - 14, "Extrait le " + model.dateLabel, 9, false, MUTED);
    p.line(70, 118, 250, 118, NAVY, 0.7);
    p.text(70, 104, "Pour l'association", 8, false, MUTED);
    p.text(70, 90, "Association Morocco's Creativity", 10, true, NAVY);
    p.line(48, 74, 547, 74, LINE, 0.6);
    p.center(297, 60, "ACX Flow  ·  flow.acx.ma  ·  flow@acx.ma", 8, true, NAVY);
    p.center(297, 48, "ACX Maroc  ·  acx.ma  ·  contact@acx.ma", 8, false, INK);
    p.center(297, 36, "+212 634 232 006", 8, false, MUTED);
    return finish([p.bytes()], image);
  }

  function crc32(bytes) {
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) {
      c ^= bytes[i];
      for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
    }
    return (~c) >>> 0;
  }
  function u16(n) { return ascii(String.fromCharCode(n & 255, (n >> 8) & 255)); }
  function u32(n) { return ascii(String.fromCharCode(n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >> 24) & 255)); }
  function zipFiles(files) {
    const locals = [];
    const centrals = [];
    let offset = 0;
    files.forEach((file) => {
      const name = ascii(file.name);
      const data = file.bytes;
      const crc = crc32(data);
      const local = concat([
        u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0),
        u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0),
        name, data
      ]);
      const central = concat([
        u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0),
        u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), u16(0),
        u16(0), u16(0), u32(0), u32(offset), name
      ]);
      locals.push(local);
      centrals.push(central);
      offset += local.length;
    });
    const centralStart = offset;
    const centralBytes = concat(centrals);
    const end = concat([
      u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length),
      u32(centralBytes.length), u32(centralStart), u16(0)
    ]);
    return concat(locals.concat(centrals, [end]));
  }

  function certificatesZip(model, image) {
    const files = model.groups.map((g) => {
      const person = {
        name: g.leader.name,
        slug: g.leader.slug,
        score: g.leader.score,
        pieces: g.leader.pieces,
        money: g.leader.money,
        groupLabel: g.label,
        groupRank: g.rank,
        groupPercent: g.percent,
        groupScore: g.score,
        groupQuiet: g.members.every((m) => !m.score),
        ref: "AMC-C11-" + g.id + "-" + String(g.leader.slug || "").toUpperCase() + "-" + model.dateStamp
      };
      const safe = String(g.leader.name || "membre").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9]+/g, "-");
      return { name: "Attestation-" + g.label.replace(" ", "-") + "-" + safe + ".pdf", bytes: certificatePdf(person, model, image) };
    });
    return zipFiles(files);
  }

  root.AmcPdf = { reportPdf, certificatePdf, certificatesZip, ordinal, num };
})(typeof window !== "undefined" ? window : globalThis);
