import React, { useState } from 'react';
import { FileText, AlertTriangle, CheckCircle, Download } from 'lucide-react';

const D3EDocGenerator = () => {
  const initialData = {
    context: {
      language: "fr",
      date_format: "YYYY-MM-DD",
      document_type: "BSDD",
      render_options: { with_logo: true, colors: { primary: "#0A0A0A" } }
    },
    company: {
      producer: { name: "Société ABC", siret: "12345678900012", address: "12 rue X, 75000 Paris", contact: "jean.dupont@abc.fr" },
      collector: { name: "RecoLoop", siret: "98765432100045", address: "Parc logistique, 77000", transport_permit: "TL-2025-001" },
      processor: { name: "Traitex", siret: "11122233300066", address: "ZI Nord, 62000", icpe: "27xx", approved_flows: ["DEEE", "batteries"] }
    },
    lots: [
      {
        lot_id: "LOT-2025-0107",
        category: "informatique-telecom",
        subcategory: "pc-portables-laptops",
        mass_kg: 380,
        packages: 12,
        hazardous: false,
        ewc_codes: ["16 02 14"],
        batt_codes: [],
        serials: ["SN-A1", "SN-A2"],
        data_wipe: { method: "NIST 800-88", date: "2025-10-19", operator: "M.Durand", tool: "Blancco-like" }
      },
      {
        lot_id: "LOT-2025-0108",
        category: "informatique-telecom",
        subcategory: "pdu-onduleurs-ups",
        mass_kg: 120,
        packages: 4,
        hazardous: true,
        ewc_codes: ["16 02 13*"],
        batt_codes: ["16 06 01*"],
        battery_type: "Plomb étanche (VRLA)"
      }
    ],
    transport: {
      date_collect: "2025-10-21",
      plate_number: "AB-123-CD",
      adr_required: true,
      driver_name: "R. Martin"
    },
    signatures: {
      producer: { name: "J.Dupont", signed_at: "2025-10-21" },
      collector: { name: "R.Martin", signed_at: "2025-10-21" },
      processor: { name: "C.Leclerc", signed_at: "<A RENSEIGNER>" }
    },
    legal: {
      footnotes: [
        "Ce document est fourni à titre opérationnel et ne remplace pas un avis juridique.",
        "Vérifier les codes déchets (liste européenne des déchets) et la classification dangerosité."
      ]
    }
  };

  const [jsonInput, setJsonInput] = useState(JSON.stringify(initialData, null, 2));
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const validateData = (data) => {
    const missing = [];
    
    if (!data.company?.producer?.name) missing.push("company.producer.name - Nom du producteur requis");
    if (!data.company?.producer?.siret) missing.push("company.producer.siret - SIRET producteur requis");
    if (!data.company?.collector?.name) missing.push("company.collector.name - Nom du collecteur requis");
    if (!data.company?.processor?.name) missing.push("company.processor.name - Nom du destinataire requis");
    if (!data.transport?.date_collect) missing.push("transport.date_collect - Date de collecte requise");
    if (!data.lots || data.lots.length === 0) missing.push("lots - Au moins un lot requis");
    
    data.lots?.forEach((lot, idx) => {
      if (!lot.lot_id) missing.push(`lots[${idx}].lot_id - Identifiant de lot requis`);
      if (!lot.mass_kg || lot.mass_kg <= 0) missing.push(`lots[${idx}].mass_kg - Masse requise`);
      if (!lot.ewc_codes || lot.ewc_codes.length === 0) missing.push(`lots[${idx}].ewc_codes - Code déchet requis`);
    });
    
    return missing;
  };

  const generateHTML = (data) => {
    const docType = data.context?.document_type || 'BSDD';
    const producer = data.company?.producer || {};
    const collector = data.company?.collector || {};
    const processor = data.company?.processor || {};
    const transport = data.transport || {};
    const lots = data.lots || [];
    const signatures = data.signatures || {};
    const footnotes = data.legal?.footnotes || [];
    
    const docTitles = {
      'BSDD': 'Bordereau de Suivi des Déchets Dangereux',
      'BSDA': 'Bordereau de Suivi des Déchets d\'Amiante',
      'BORDEAU_BATTERIES': 'Bordereau de Suivi - Batteries et Accumulateurs',
      'ATTESTATION_EFFACEMENT': 'Attestation d\'Effacement de Données'
    };

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${docTitles[docType] || 'Document Réglementaire'}</title>
  <style>
    @page { 
      size: A4; 
      margin: 12mm; 
    }
    * { 
      margin: 0; 
      padding: 0; 
      box-sizing: border-box; 
    }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 11pt;
      line-height: 1.4;
      color: #1a1a1a;
    }
    .container { 
      max-width: 210mm; 
      margin: 0 auto; 
      padding: 20px;
    }
    h1 { 
      font-size: 18pt; 
      font-weight: 700; 
      margin-bottom: 20px;
      color: ${data.context?.render_options?.colors?.primary || '#0A0A0A'};
      border-bottom: 3px solid ${data.context?.render_options?.colors?.primary || '#0A0A0A'};
      padding-bottom: 10px;
    }
    h2 { 
      font-size: 14pt; 
      font-weight: 600; 
      margin: 20px 0 10px;
      color: #2a2a2a;
    }
    .meta-info {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 20px;
      font-size: 10pt;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }
    .info-card {
      border: 1px solid #ddd;
      padding: 12px;
      border-radius: 6px;
      background: #fafafa;
    }
    .info-card h3 {
      font-size: 11pt;
      font-weight: 600;
      margin-bottom: 8px;
      color: #0A0A0A;
    }
    .info-card p {
      font-size: 10pt;
      margin: 4px 0;
    }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 15px 0;
      font-size: 10pt;
    }
    th, td { 
      border: 1px solid #ddd; 
      padding: 10px; 
      text-align: left; 
    }
    th { 
      background: #f0f0f0; 
      font-weight: 600;
      color: #2a2a2a;
    }
    tr:nth-child(even) { 
      background: #fafafa; 
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 9pt;
      font-weight: 600;
      margin: 2px;
    }
    .badge-danger {
      background: #fee;
      color: #c00;
      border: 1px solid #fcc;
    }
    .badge-adr {
      background: #fff3cd;
      color: #856404;
      border: 1px solid #ffeaa7;
    }
    .badge-safe {
      background: #e8f5e9;
      color: #2e7d32;
      border: 1px solid #a5d6a7;
    }
    .signatures {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin: 30px 0;
      page-break-inside: avoid;
    }
    .signature-box {
      border: 1px solid #ddd;
      padding: 15px;
      border-radius: 6px;
      min-height: 120px;
      background: #fafafa;
    }
    .signature-box h4 {
      font-size: 10pt;
      font-weight: 600;
      margin-bottom: 10px;
      color: #2a2a2a;
    }
    .signature-box p {
      font-size: 9pt;
      margin: 5px 0;
    }
    .signature-placeholder {
      height: 60px;
      border: 1px dashed #ccc;
      margin: 10px 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
      font-size: 9pt;
      font-style: italic;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 9pt;
      color: #666;
    }
    .footer p {
      margin: 5px 0;
    }
    .alert {
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      padding: 12px;
      border-radius: 6px;
      margin: 15px 0;
      font-size: 10pt;
    }
    .alert strong {
      color: #856404;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${docTitles[docType] || 'Document Réglementaire'}</h1>
    
    <div class="meta-info">
      <strong>Date de collecte :</strong> ${transport.date_collect || '<A RENSEIGNER>'} | 
      <strong>Véhicule :</strong> ${transport.plate_number || '<A RENSEIGNER>'} | 
      <strong>Conducteur :</strong> ${transport.driver_name || '<A RENSEIGNER>'}
      ${transport.adr_required ? ' | <span class="badge badge-adr">TRANSPORT ADR</span>' : ''}
    </div>

    <div class="info-grid">
      <div class="info-card">
        <h3>📦 Producteur / Émetteur</h3>
        <p><strong>${producer.name || '<A RENSEIGNER>'}</strong></p>
        <p>SIRET : ${producer.siret || '<A RENSEIGNER>'}</p>
        <p>${producer.address || '<A RENSEIGNER>'}</p>
        ${producer.contact ? `<p>Contact : ${producer.contact}</p>` : ''}
      </div>
      
      <div class="info-card">
        <h3>🚛 Collecteur / Transporteur</h3>
        <p><strong>${collector.name || '<A RENSEIGNER>'}</strong></p>
        <p>SIRET : ${collector.siret || '<A RENSEIGNER>'}</p>
        <p>${collector.address || '<A RENSEIGNER>'}</p>
        ${collector.transport_permit ? `<p>Récépissé : ${collector.transport_permit}</p>` : ''}
      </div>
      
      <div class="info-card">
        <h3>🏭 Destinataire / Installation</h3>
        <p><strong>${processor.name || '<A RENSEIGNER>'}</strong></p>
        <p>SIRET : ${processor.siret || '<A RENSEIGNER>'}</p>
        <p>${processor.address || '<A RENSEIGNER>'}</p>
        ${processor.icpe ? `<p>ICPE : ${processor.icpe}</p>` : ''}
      </div>
    </div>

    <h2>📋 Lots de Déchets</h2>
    <table>
      <thead>
        <tr>
          <th>N° Lot</th>
          <th>Catégorie / Sous-catégorie</th>
          <th>Codes Déchets</th>
          <th>Masse (kg)</th>
          <th>Colis</th>
          <th>Statut</th>
        </tr>
      </thead>
      <tbody>
        ${lots.map(lot => `
          <tr>
            <td><strong>${lot.lot_id || '<A RENSEIGNER>'}</strong></td>
            <td>${lot.category || ''}<br/><small style="color: #666;">${lot.subcategory || ''}</small></td>
            <td>
              ${(lot.ewc_codes || []).join(', ')}
              ${lot.batt_codes && lot.batt_codes.length > 0 ? '<br/>' + lot.batt_codes.join(', ') : ''}
              ${lot.battery_type ? `<br/><small style="color: #666;">${lot.battery_type}</small>` : ''}
            </td>
            <td><strong>${lot.mass_kg || 0}</strong></td>
            <td>${lot.packages || 0}</td>
            <td>
              ${lot.hazardous ? '<span class="badge badge-danger">DANGEREUX</span>' : '<span class="badge badge-safe">NON DANGEREUX</span>'}
              ${transport.adr_required && lot.hazardous ? '<span class="badge badge-adr">ADR</span>' : ''}
            </td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3"><strong>TOTAL</strong></td>
          <td><strong>${lots.reduce((sum, lot) => sum + (lot.mass_kg || 0), 0)} kg</strong></td>
          <td><strong>${lots.reduce((sum, lot) => sum + (lot.packages || 0), 0)}</strong></td>
          <td></td>
        </tr>
      </tfoot>
    </table>

    ${docType === 'ATTESTATION_EFFACEMENT' ? `
      <h2>🔒 Informations d'Effacement</h2>
      <div class="info-card">
        ${lots.filter(lot => lot.data_wipe).map(lot => `
          <p><strong>Lot ${lot.lot_id}</strong></p>
          <p>Méthode : ${lot.data_wipe.method || '<A RENSEIGNER>'}</p>
          <p>Outil : ${lot.data_wipe.tool || '<A RENSEIGNER>'}</p>
          <p>Opérateur : ${lot.data_wipe.operator || '<A RENSEIGNER>'}</p>
          <p>Date : ${lot.data_wipe.date || '<A RENSEIGNER>'}</p>
          ${lot.serials ? `<p>Numéros de série : ${lot.serials.join(', ')}</p>` : ''}
        `).join('<hr style="margin: 15px 0; border: none; border-top: 1px solid #ddd;"/>')}
      </div>
    ` : ''}

    <h2>✍️ Signatures</h2>
    <div class="signatures">
      <div class="signature-box">
        <h4>Producteur / Émetteur</h4>
        <p><strong>${signatures.producer?.name || '<A RENSEIGNER>'}</strong></p>
        <p>Date : ${signatures.producer?.signed_at || '<A RENSEIGNER>'}</p>
        <div class="signature-placeholder">Signature</div>
      </div>
      
      <div class="signature-box">
        <h4>Collecteur / Transporteur</h4>
        <p><strong>${signatures.collector?.name || '<A RENSEIGNER>'}</strong></p>
        <p>Date : ${signatures.collector?.signed_at || '<A RENSEIGNER>'}</p>
        <div class="signature-placeholder">Signature</div>
      </div>
      
      <div class="signature-box">
        <h4>Destinataire</h4>
        <p><strong>${signatures.processor?.name || '<A RENSEIGNER>'}</strong></p>
        <p>Date : ${signatures.processor?.signed_at || '<A RENSEIGNER>'}</p>
        <div class="signature-placeholder">Signature</div>
      </div>
    </div>

    <div class="footer">
      ${footnotes.map(note => `<p>⚠️ ${note}</p>`).join('')}
      <p style="margin-top: 15px; color: #999; font-size: 8pt;">
        Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
      </p>
    </div>
  </div>
</body>
</html>`;

    return html;
  };

  const generateDocument = () => {
    setError('');
    setResult(null);
    
    try {
      const data = JSON.parse(jsonInput);
      const missing = validateData(data);
      
      const docType = data.context?.document_type || 'BSDD';
      const dateStr = data.transport?.date_collect?.replace(/-/g, '') || new Date().toISOString().split('T')[0].replace(/-/g, '');
      const lotId = data.lots?.[0]?.lot_id || 'MULTI';
      
      const filenameMap = {
        'BSDD': `BSDD_${dateStr}_${lotId}.pdf`,
        'BSDA': `BSDA_${dateStr}_${lotId}.pdf`,
        'BORDEAU_BATTERIES': `BATTERIES_${dateStr}.pdf`,
        'ATTESTATION_EFFACEMENT': `EFFACEMENT_${dateStr}_${lotId}.pdf`
      };
      
      const normalized = {
        document_type: docType,
        producer: data.company?.producer || {},
        collector: data.company?.collector || {},
        processor: data.company?.processor || {},
        transport: data.transport || {},
        lots: data.lots || [],
        signatures: data.signatures || {},
        notes: missing.length > 0 ? [`${missing.length} champ(s) à renseigner`] : ['Document complet']
      };
      
      const html = generateHTML(data);
      
      const output = {
        status: missing.length > 0 ? 'warning' : 'ok',
        missing_fields: missing,
        normalized: normalized,
        filenames: [filenameMap[docType] || `DOCUMENT_${dateStr}.pdf`],
        html: {
          doctype: 'text/html',
          body: html
        }
      };
      
      setResult(output);
    } catch (err) {
      setError(`Erreur de parsing JSON : ${err.message}`);
    }
  };

  const loadExample = () => {
    setJsonInput(JSON.stringify(initialData, null, 2));
  };

  const loadBSDD = () => {
    const bsddData = {
      context: {
        language: "fr",
        date_format: "YYYY-MM-DD",
        document_type: "BSDD",
        render_options: { with_logo: true, colors: { primary: "#DC2626" } }
      },
      company: {
        producer: { name: "TechCorp Industries", siret: "85234567800023", address: "45 Avenue de la République, 69003 Lyon", contact: "marie.lambert@techcorp.fr" },
        collector: { name: "EcoTransport Pro", siret: "75123456700034", address: "Zone Industrielle Nord, 38100 Grenoble", transport_permit: "TR-2024-456" },
        processor: { name: "RecyclaGe Avancé", siret: "91287654300012", address: "Parc Écologique, 13015 Marseille", icpe: "2771", approved_flows: ["DEEE", "Déchets dangereux"] }
      },
      lots: [
        {
          lot_id: "LOT-DD-2025-0215",
          category: "equipements-electriques",
          subcategory: "onduleurs-industriels",
          mass_kg: 450,
          packages: 8,
          hazardous: true,
          ewc_codes: ["16 02 13*"],
          batt_codes: ["16 06 01*"],
          battery_type: "Batteries Plomb-Acide (VRLA)"
        },
        {
          lot_id: "LOT-DD-2025-0216",
          category: "composants-electroniques",
          subcategory: "cartes-circuits-imprimes",
          mass_kg: 280,
          packages: 15,
          hazardous: true,
          ewc_codes: ["16 02 15*"],
          batt_codes: []
        }
      ],
      transport: {
        date_collect: "2025-10-25",
        plate_number: "FG-789-HJ",
        adr_required: true,
        driver_name: "P. Rousseau"
      },
      signatures: {
        producer: { name: "M.Lambert", signed_at: "2025-10-25" },
        collector: { name: "P.Rousseau", signed_at: "2025-10-25" },
        processor: { name: "<A RENSEIGNER>", signed_at: "<A RENSEIGNER>" }
      },
      legal: {
        footnotes: [
          "Transport soumis à la réglementation ADR - Classe 9 Matières dangereuses diverses.",
          "Ce bordereau doit être conservé 3 ans par chaque partie prenante.",
          "Document fourni à titre opérationnel - Vérifier la conformité réglementaire."
        ]
      }
    };
    setJsonInput(JSON.stringify(bsddData, null, 2));
  };

  const loadBSDA = () => {
    const bsdaData = {
      context: {
        language: "fr",
        date_format: "YYYY-MM-DD",
        document_type: "BSDA",
        render_options: { with_logo: true, colors: { primary: "#EA580C" } }
      },
      company: {
        producer: { name: "Démolition Bâti-Rénov", siret: "45678912300056", address: "12 Rue des Artisans, 59000 Lille", contact: "j.dubois@batireno.fr" },
        collector: { name: "AmianteSecure Transport", siret: "65432198700023", address: "Zone Logistique Est, 57000 Metz", transport_permit: "AM-2024-789" },
        processor: { name: "Centre Traitement Amiante Pro", siret: "32165498700045", address: "Site Sécurisé ISDI, 62000 Arras", icpe: "2760-1", approved_flows: ["Amiante-ciment", "Matériaux amiantés"] }
      },
      lots: [
        {
          lot_id: "LOT-AM-2025-0312",
          category: "materiaux-construction",
          subcategory: "plaques-fibrociment-amiante",
          mass_kg: 1850,
          packages: 42,
          hazardous: true,
          ewc_codes: ["17 06 05*"],
          batt_codes: []
        },
        {
          lot_id: "LOT-AM-2025-0313",
          category: "materiaux-isolation",
          subcategory: "flocage-amiante",
          mass_kg: 320,
          packages: 8,
          hazardous: true,
          ewc_codes: ["17 06 01*"],
          batt_codes: []
        }
      ],
      transport: {
        date_collect: "2025-10-28",
        plate_number: "AM-456-BT",
        adr_required: true,
        driver_name: "L. Martin (Certifié SS4)"
      },
      signatures: {
        producer: { name: "J.Dubois", signed_at: "2025-10-28" },
        collector: { name: "L.Martin", signed_at: "2025-10-28" },
        processor: { name: "<A RENSEIGNER>", signed_at: "<A RENSEIGNER>" }
      },
      legal: {
        footnotes: [
          "Déchets d'amiante - Manipulation par personnel qualifié uniquement (SS3/SS4).",
          "Conditionnement : double emballage étanche et étiqueté 'AMIANTE'.",
          "Transport conforme à l'accord ADR - Classe 9, UN 2212 ou UN 2590.",
          "Conservation du bordereau : 5 ans minimum."
        ]
      }
    };
    setJsonInput(JSON.stringify(bsdaData, null, 2));
  };

  const loadBatteries = () => {
    const batteriesData = {
      context: {
        language: "fr",
        date_format: "YYYY-MM-DD",
        document_type: "BORDEAU_BATTERIES",
        render_options: { with_logo: true, colors: { primary: "#16A34A" } }
      },
      company: {
        producer: { name: "MegaStore Électronique", siret: "78945612300089", address: "Centre Commercial Ouest, 44000 Nantes", contact: "s.bernard@megastore.fr" },
        collector: { name: "BatteryCollect France", siret: "98765432100078", address: "Plateforme Logistique, 37000 Tours", transport_permit: "BAT-2024-321" },
        processor: { name: "EcoRecycle Batteries", siret: "14725836900034", address: "Zone Recyclage, 59300 Valenciennes", icpe: "2711", approved_flows: ["Batteries Pb", "Batteries Li-ion", "Accumulateurs NiMH"] }
      },
      lots: [
        {
          lot_id: "LOT-BAT-2025-0445",
          category: "batteries-accumulateurs",
          subcategory: "batteries-lithium-ion",
          mass_kg: 285,
          packages: 24,
          hazardous: true,
          ewc_codes: ["16 06 02*"],
          batt_codes: ["16 06 02*"],
          battery_type: "Lithium-Ion (Li-ion) - Smartphones & Tablettes"
        },
        {
          lot_id: "LOT-BAT-2025-0446",
          category: "batteries-accumulateurs",
          subcategory: "batteries-plomb",
          mass_kg: 540,
          packages: 12,
          hazardous: true,
          ewc_codes: ["16 06 01*"],
          batt_codes: ["16 06 01*"],
          battery_type: "Batteries Plomb-Acide scellées (VRLA/AGM)"
        },
        {
          lot_id: "LOT-BAT-2025-0447",
          category: "batteries-accumulateurs",
          subcategory: "piles-alcalines",
          mass_kg: 95,
          packages: 8,
          hazardous: false,
          ewc_codes: ["16 06 05"],
          batt_codes: ["16 06 05"],
          battery_type: "Piles alcalines et salines (non dangereuses)"
        }
      ],
      transport: {
        date_collect: "2025-10-22",
        plate_number: "BT-852-LK",
        adr_required: true,
        driver_name: "A. Petit (ADR Classe 9)"
      },
      signatures: {
        producer: { name: "S.Bernard", signed_at: "2025-10-22" },
        collector: { name: "A.Petit", signed_at: "2025-10-22" },
        processor: { name: "<A RENSEIGNER>", signed_at: "<A RENSEIGNER>" }
      },
      legal: {
        footnotes: [
          "Transport ADR : UN 3480 (Li-ion seul), UN 3481 (avec équipement), UN 2794 (Batteries Pb).",
          "Éco-organismes : Screlec, Corepile, ou système individuel approuvé.",
          "Recyclage obligatoire : taux minimum 45% (Pb), 50% (Li-ion) selon directive 2006/66/CE.",
          "Conditionnement : protection contre court-circuits obligatoire."
        ]
      }
    };
    setJsonInput(JSON.stringify(batteriesData, null, 2));
  };

  const loadEffacement = () => {
    const effacementData = {
      context: {
        language: "fr",
        date_format: "YYYY-MM-DD",
        document_type: "ATTESTATION_EFFACEMENT",
        render_options: { with_logo: true, colors: { primary: "#7C3AED" } }
      },
      company: {
        producer: { name: "Banque Digitale Pro", siret: "32165498700123", address: "Tour Financière, 92400 Courbevoie", contact: "securite@banquedigitale.fr" },
        collector: { name: "SecureIT Logistics", siret: "65498732100056", address: "Centre Sécurisé, 78000 Versailles", transport_permit: "SEC-2024-159" },
        processor: { name: "DataWipe Certified", siret: "78932165400089", address: "Site Sécurisé ISO 27001, 91000 Évry", icpe: "N/A", approved_flows: ["Effacement données", "Destruction supports"] }
      },
      lots: [
        {
          lot_id: "LOT-EFF-2025-0789",
          category: "informatique-telecom",
          subcategory: "serveurs-data-center",
          mass_kg: 680,
          packages: 15,
          hazardous: false,
          ewc_codes: ["16 02 14"],
          batt_codes: [],
          serials: ["SRV-DC-001", "SRV-DC-002", "SRV-DC-003", "SRV-DC-004", "SRV-DC-005", "SRV-DC-006", "SRV-DC-007", "SRV-DC-008", "SRV-DC-009", "SRV-DC-010", "SRV-DC-011", "SRV-DC-012", "SRV-DC-013", "SRV-DC-014", "SRV-DC-015"],
          data_wipe: { 
            method: "NIST SP 800-88 Rev.1 (Purge) + DoD 5220.22-M (7 passes)", 
            date: "2025-10-20", 
            operator: "Mme C. Durand (Certifiée DataWipe)", 
            tool: "Blancco Drive Eraser v7.5 (Certifié ADISA/NCSC)"
          }
        },
        {
          lot_id: "LOT-EFF-2025-0790",
          category: "informatique-telecom",
          subcategory: "disques-durs-ssd",
          mass_kg: 42,
          packages: 3,
          hazardous: false,
          ewc_codes: ["16 02 14"],
          batt_codes: [],
          serials: ["HDD-2TB-A125", "HDD-2TB-A126", "HDD-2TB-A127", "SSD-1TB-B089", "SSD-1TB-B090", "SSD-512-C045"],
          data_wipe: { 
            method: "Effacement cryptographique (AES-256) + Vérification", 
            date: "2025-10-20", 
            operator: "M. P. Leclerc (Certifié)", 
            tool: "Blancco Drive Eraser v7.5"
          }
        },
        {
          lot_id: "LOT-DEST-2025-0791",
          category: "informatique-telecom",
          subcategory: "disques-durs-defectueux",
          mass_kg: 38,
          packages: 2,
          hazardous: false,
          ewc_codes: ["16 02 14"],
          batt_codes: [],
          serials: ["HDD-FAIL-X501", "HDD-FAIL-X502", "HDD-FAIL-X503"],
          data_wipe: { 
            method: "Destruction physique (broyage < 6mm) - Support non fonctionnel", 
            date: "2025-10-20", 
            operator: "Équipe Destruction Certifiée", 
            tool: "Broyeur industriel haute sécurité (Norme DIN 66399 P-4/H-5)"
          }
        }
      ],
      transport: {
        date_collect: "2025-10-21",
        plate_number: "SEC-741-XY",
        adr_required: false,
        driver_name: "R. Moreau (Habilitation Sécurité)"
      },
      signatures: {
        producer: { name: "RSSI - P.Fontaine", signed_at: "2025-10-21" },
        collector: { name: "R.Moreau", signed_at: "2025-10-21" },
        processor: { name: "C.Durand - DataWipe Certified", signed_at: "2025-10-20" }
      },
      legal: {
        footnotes: [
          "Conformité RGPD (Art. 17, 32) - Droit à l'effacement et sécurité des traitements.",
          "Normes appliquées : NIST SP 800-88, DoD 5220.22-M, DIN 66399 (P-4/H-5 pour destruction).",
          "Certificats d'effacement individuels disponibles sur demande (rapport Blancco par S/N).",
          "Chaîne de traçabilité sécurisée - Conservation 5 ans.",
          "Cette attestation certifie l'impossibilité de récupération des données effacées/détruites."
        ]
      }
    };
    setJsonInput(JSON.stringify(effacementData, null, 2));
  };

  const downloadHTML = () => {
    if (!result) return;
    const blob = new Blob([result.html.body], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.filenames[0].replace('.pdf', '.html');
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadJSON = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document_normalized.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">Générateur Documents D3E Réglementaires</h1>
          </div>
          
          <p className="text-gray-600 mb-4">
            Génération automatique de BSDD, BSDA, bordereaux batteries et attestations d'effacement conformes à la réglementation française.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="font-semibold text-gray-700">Données JSON d'entrée</label>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  onClick={loadBSDD}
                  className="text-sm bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-3 rounded transition-colors"
                >
                  📋 BSDD
                </button>
                <button
                  onClick={loadBSDA}
                  className="text-sm bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-3 rounded transition-colors"
                >
                  ⚠️ BSDA
                </button>
                <button
                  onClick={loadBatteries}
                  className="text-sm bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-3 rounded transition-colors"
                >
                  🔋 Batteries
                </button>
                <button
                  onClick={loadEffacement}
                  className="text-sm bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-3 rounded transition-colors"
                >
                  🔒 Effacement
                </button>
              </div>
              
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder="Cliquez sur un bouton ci-dessus pour charger un exemple"
                className="w-full h-80 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              
              <button
                onClick={generateDocument}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <FileText className="w-5 h-5" />
                Générer le Document
              </button>
              
              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}
            </div>

            <div>
              {result && (
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg border-2 ${
                    result.status === 'ok' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {result.status === 'ok' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      )}
                      <h3 className="font-semibold">
                        {result.status === 'ok' ? 'Document généré avec succès' : 'Document généré avec avertissements'}
                      </h3>
                    </div>
                    
                    {result.missing_fields.length > 0 && (
                      <div className="mt-3">
                        <p className="font-semibold text-sm mb-2">Champs à renseigner :</p>
                        <ul className="text-sm space-y-1">
                          {result.missing_fields.map((field, idx) => (
                            <li key={idx} className="text-gray-700">• {field}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="font-semibold mb-2">Fichier généré</h3>
                    <p className="text-sm text-gray-700 font-mono">{result.filenames[0]}</p>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={downloadHTML}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      <Download className="w-5 h-5" />
                      Télécharger HTML (prêt PDF)
                    </button>
                    
                    <button
                      onClick={downloadJSON}
                      className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      <Download className="w-5 h-5" />
                      Télécharger JSON normalisé
                    </button>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-sm">
                    <p className="font-semibold mb-2">📝 Étapes suivantes :</p>
                    <ol className="space-y-1 text-gray-700">
                      <li>1. Télécharger le fichier HTML</li>
                      <li>2. Convertir en PDF avec wkhtmltopdf, Puppeteer ou lib PHP</li>
                      <li>3. Archiver avec hash pour traçabilité</li>
                      <li>4. Compléter les champs manquants si nécessaire</li>
                    </ol>
                  </div>

                  <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
                    <div className="bg-gray-100 px-4 py-2 border-b border-gray-300">
                      <h3 className="font-semibold text-gray-800">📄 Aperçu du Document</h3>
                    </div>
                    <div className="p-4 max-h-96 overflow-y-auto">
                      <iframe
                        srcDoc={result.html.body}
                        className="w-full h-96 border-0"
                        title="Aperçu du document"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {!result && (
                <div className="h-full flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-center p-8">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Le document généré apparaîtra ici</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Types de documents supportés</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { type: 'BSDD', title: 'Bordereau Déchets Dangereux', desc: 'Suivi réglementaire des DD' },
              { type: 'BSDA', title: 'Bordereau Amiante', desc: 'Désamiantage spécifique' },
              { type: 'BORDEAU_BATTERIES', title: 'Bordereau Batteries', desc: 'Accumulateurs Pb/Li-ion' },
              { type: 'ATTESTATION_EFFACEMENT', title: 'Attestation Effacement', desc: 'Destruction données RGPD' }
            ].map((doc) => (
              <div key={doc.type} className="p-4 border border-gray-200 rounded-lg hover:border-blue-400 transition-colors">
                <h3 className="font-semibold text-gray-800 mb-1">{doc.title}</h3>
                <p className="text-sm text-gray-600">{doc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default D3EDocGenerator;