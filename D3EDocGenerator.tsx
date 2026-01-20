import React, { useState, useEffect } from 'react';
import { FileText, FolderPlus, CheckCircle, AlertTriangle, FileCheck, ClipboardList, Shield, Battery, Lock } from 'lucide-react';

const D3EDocGenerator = ({ caseFileId }: { caseFileId: string }) => {
  const [selectedType, setSelectedType] = useState('');
  const [result, setResult] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const documentTypes = [
    {
      value: 'BSDD',
      label: 'Bordereau Déchets Dangereux',
      shortLabel: 'BSDD',
      Icon: ClipboardList,
      color: 'red',
      description: 'Suivi réglementaire des déchets dangereux'
    },
    {
      value: 'BSDA',
      label: 'Bordereau Déchets d\'Amiante',
      shortLabel: 'BSDA',
      Icon: Shield,
      color: 'orange',
      description: 'Désamiantage et matériaux spécifiques'
    },
    {
      value: 'BORDEAU_BATTERIES',
      label: 'Bordereau Batteries et Accumulateurs',
      shortLabel: 'Batteries',
      Icon: Battery,
      color: 'green',
      description: 'Accumulateurs Pb/Li-ion et piles'
    },
    {
      value: 'ATTESTATION_EFFACEMENT',
      label: 'Attestation d\'Effacement de Données',
      shortLabel: 'Effacement',
      Icon: Lock,
      color: 'purple',
      description: 'Destruction données conformité RGPD'
    }
  ];

  const getDataForType = (docType) => {
    const commonProducer = { name: "TechCorp Industries", siret: "85234567800023", address: "45 Avenue de la République, 69003 Lyon", contact: "marie.lambert@techcorp.fr" };
    const commonCollector = { name: "EcoTransport Pro", siret: "75123456700034", address: "Zone Industrielle Nord, 38100 Grenoble", transport_permit: "TR-2024-456" };
    const commonProcessor = { name: "RecyclaGe Avancé", siret: "91287654300012", address: "Parc Écologique, 13015 Marseille", icpe: "2771", approved_flows: ["DEEE", "Déchets dangereux"] };

    const dataTemplates = {
      'BSDD': {
        context: {
          language: "fr",
          date_format: "YYYY-MM-DD",
          document_type: "BSDD",
          render_options: { with_logo: true, colors: { primary: "#DC2626" } }
        },
        company: {
          producer: commonProducer,
          collector: commonCollector,
          processor: commonProcessor
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
          }
        ],
        transport: {
          date_collect: new Date().toISOString().split('T')[0],
          plate_number: "FG-789-HJ",
          adr_required: true,
          driver_name: "P. Rousseau"
        },
        signatures: {
          producer: { name: "M.Lambert", signed_at: new Date().toISOString().split('T')[0] },
          collector: { name: "P.Rousseau", signed_at: new Date().toISOString().split('T')[0] },
          processor: { name: "<A RENSEIGNER>", signed_at: "<A RENSEIGNER>" }
        },
        legal: {
          footnotes: [
            "Transport soumis à la réglementation ADR - Classe 9 Matières dangereuses diverses.",
            "Ce bordereau doit être conservé 3 ans par chaque partie prenante.",
            "Document fourni à titre opérationnel - Vérifier la conformité réglementaire."
          ]
        }
      },
      'BSDA': {
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
          }
        ],
        transport: {
          date_collect: new Date().toISOString().split('T')[0],
          plate_number: "AM-456-BT",
          adr_required: true,
          driver_name: "L. Martin (Certifié SS4)"
        },
        signatures: {
          producer: { name: "J.Dubois", signed_at: new Date().toISOString().split('T')[0] },
          collector: { name: "L.Martin", signed_at: new Date().toISOString().split('T')[0] },
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
      },
      'BORDEAU_BATTERIES': {
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
          }
        ],
        transport: {
          date_collect: new Date().toISOString().split('T')[0],
          plate_number: "BT-852-LK",
          adr_required: true,
          driver_name: "A. Petit (ADR Classe 9)"
        },
        signatures: {
          producer: { name: "S.Bernard", signed_at: new Date().toISOString().split('T')[0] },
          collector: { name: "A.Petit", signed_at: new Date().toISOString().split('T')[0] },
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
      },
      'ATTESTATION_EFFACEMENT': {
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
            serials: ["SRV-DC-001", "SRV-DC-002", "SRV-DC-003", "SRV-DC-004", "SRV-DC-005"],
            data_wipe: {
              method: "NIST SP 800-88 Rev.1 (Purge) + DoD 5220.22-M (7 passes)",
              date: new Date().toISOString().split('T')[0],
              operator: "Mme C. Durand (Certifiée DataWipe)",
              tool: "Blancco Drive Eraser v7.5 (Certifié ADISA/NCSC)"
            }
          }
        ],
        transport: {
          date_collect: new Date().toISOString().split('T')[0],
          plate_number: "SEC-741-XY",
          adr_required: false,
          driver_name: "R. Moreau (Habilitation Sécurité)"
        },
        signatures: {
          producer: { name: "RSSI - P.Fontaine", signed_at: new Date().toISOString().split('T')[0] },
          collector: { name: "R.Moreau", signed_at: new Date().toISOString().split('T')[0] },
          processor: { name: "C.Durand - DataWipe Certified", signed_at: new Date().toISOString().split('T')[0] }
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
      }
    };

    return dataTemplates[docType];
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
    @page { size: A4; margin: 12mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 11pt;
      line-height: 1.4;
      color: #1a1a1a;
    }
    .container { max-width: 210mm; margin: 0 auto; padding: 20px; }
    h1 {
      font-size: 18pt;
      font-weight: 700;
      margin-bottom: 20px;
      color: ${data.context?.render_options?.colors?.primary || '#0A0A0A'};
      border-bottom: 3px solid ${data.context?.render_options?.colors?.primary || '#0A0A0A'};
      padding-bottom: 10px;
    }
    h2 { font-size: 14pt; font-weight: 600; margin: 20px 0 10px; color: #2a2a2a; }
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
    .info-card p { font-size: 10pt; margin: 4px 0; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 10pt; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    th { background: #f0f0f0; font-weight: 600; color: #2a2a2a; }
    tr:nth-child(even) { background: #fafafa; }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 9pt;
      font-weight: 600;
      margin: 2px;
    }
    .badge-danger { background: #fee; color: #c00; border: 1px solid #fcc; }
    .badge-safe { background: #e8f5e9; color: #2e7d32; border: 1px solid #a5d6a7; }
    .signatures {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin: 30px 0;
    }
    .signature-box {
      border: 1px solid #ddd;
      padding: 15px;
      border-radius: 6px;
      min-height: 120px;
      background: #fafafa;
    }
    .signature-box h4 { font-size: 10pt; font-weight: 600; margin-bottom: 10px; color: #2a2a2a; }
    .signature-box p { font-size: 9pt; margin: 5px 0; }
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
    .footer p { margin: 5px 0; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${docTitles[docType] || 'Document Réglementaire'}</h1>

    <div class="meta-info">
      <strong>Date de collecte :</strong> ${transport.date_collect || '<A RENSEIGNER>'} |
      <strong>Véhicule :</strong> ${transport.plate_number || '<A RENSEIGNER>'} |
      <strong>Conducteur :</strong> ${transport.driver_name || '<A RENSEIGNER>'}
    </div>

    <div class="info-grid">
      <div class="info-card">
        <h3>📦 Producteur / Émetteur</h3>
        <p><strong>${producer.name || '<A RENSEIGNER>'}</strong></p>
        <p>SIRET : ${producer.siret || '<A RENSEIGNER>'}</p>
        <p>${producer.address || '<A RENSEIGNER>'}</p>
      </div>

      <div class="info-card">
        <h3>🚛 Collecteur / Transporteur</h3>
        <p><strong>${collector.name || '<A RENSEIGNER>'}</strong></p>
        <p>SIRET : ${collector.siret || '<A RENSEIGNER>'}</p>
        <p>${collector.address || '<A RENSEIGNER>'}</p>
      </div>

      <div class="info-card">
        <h3>🏭 Destinataire / Installation</h3>
        <p><strong>${processor.name || '<A RENSEIGNER>'}</strong></p>
        <p>SIRET : ${processor.siret || '<A RENSEIGNER>'}</p>
        <p>${processor.address || '<A RENSEIGNER>'}</p>
      </div>
    </div>

    <h2>📋 Lots de Déchets</h2>
    <table>
      <thead>
        <tr>
          <th>N° Lot</th>
          <th>Catégorie</th>
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
            <td>${(lot.ewc_codes || []).join(', ')}</td>
            <td><strong>${lot.mass_kg || 0}</strong></td>
            <td>${lot.packages || 0}</td>
            <td>
              ${lot.hazardous ? '<span class="badge badge-danger">DANGEREUX</span>' : '<span class="badge badge-safe">NON DANGEREUX</span>'}
            </td>
          </tr>
        `).join('')}
      </tbody>
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
        `).join('<hr style="margin: 15px 0;"/>')}
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

  useEffect(() => {
    if (selectedType) {
      setIsGenerating(true);
      setTimeout(() => {
        const data = getDataForType(selectedType);
        const html = generateHTML(data);

        const docType = selectedType;
        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const lotId = data.lots?.[0]?.lot_id || 'MULTI';

        const filenameMap = {
          'BSDD': `BSDD_${dateStr}_${lotId}.pdf`,
          'BSDA': `BSDA_${dateStr}_${lotId}.pdf`,
          'BORDEAU_BATTERIES': `BATTERIES_${dateStr}.pdf`,
          'ATTESTATION_EFFACEMENT': `EFFACEMENT_${dateStr}_${lotId}.pdf`
        };

        const output = {
          status: 'ok',
          document_type: docType,
          filename: filenameMap[docType] || `DOCUMENT_${dateStr}.pdf`,
          html: {
            doctype: 'text/html',
            body: html
          }
        };

        setResult(output);
        setIsGenerating(false);
      }, 300);
    }
  }, [selectedType]);

  const addToFolder = async () => {
    if (!result || !caseFileId) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/case-files/${caseFileId}/documents/generated`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: result.filename,
          htmlContent: result.html.body,
          documentType: result.document_type,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Document ajouté au dossier avec succès !');
      } else {
        alert(`Erreur: ${data.error}`);
      }
    } catch (error) {
      console.error('Error saving document:', error);
      alert('Erreur lors de la sauvegarde du document');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedDoc = documentTypes.find(doc => doc.value === selectedType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
          <FileText className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Génération automatique de documents
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Sélectionnez un type de document pour le générer instantanément
          </p>
        </div>
      </div>

      {/* Main Grid Layout: Buttons Left, Preview Right */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Left Column - Document Type Selector */}
        <div className="lg:col-span-2 space-y-4">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
            Type de document
          </label>
          <div className="space-y-3">
            {documentTypes.map((doc) => {
              const DocIcon = doc.Icon;
              const isSelected = selectedType === doc.value;

              const colorClasses = {
                red: {
                  selected: 'border-red-500 bg-red-50 dark:bg-red-900/20',
                  icon: 'text-red-600 dark:text-red-400',
                  hover: 'hover:border-red-200'
                },
                orange: {
                  selected: 'border-orange-500 bg-orange-50 dark:bg-orange-900/20',
                  icon: 'text-orange-600 dark:text-orange-400',
                  hover: 'hover:border-orange-200'
                },
                green: {
                  selected: 'border-green-500 bg-green-50 dark:bg-green-900/20',
                  icon: 'text-green-600 dark:text-green-400',
                  hover: 'hover:border-green-200'
                },
                purple: {
                  selected: 'border-purple-500 bg-purple-50 dark:bg-purple-900/20',
                  icon: 'text-purple-600 dark:text-purple-400',
                  hover: 'hover:border-purple-200'
                }
              };

              const colors = colorClasses[doc.color];

              return (
                <button
                  key={doc.value}
                  onClick={() => setSelectedType(doc.value)}
                  className={`relative group w-full p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                    isSelected
                      ? `${colors.selected} shadow-lg`
                      : `border-slate-200 dark:border-slate-700 ${colors.hover} hover:shadow-md`
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`transition-all duration-300 ${
                      isSelected ? `${colors.icon} scale-110` : 'text-slate-400 dark:text-slate-500 group-hover:scale-110'
                    }`}>
                      <DocIcon className="w-6 h-6" strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          {doc.shortLabel}
                        </span>
                      </div>
                      <div className="font-semibold text-slate-900 dark:text-white text-sm mb-1">
                        {doc.label}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        {doc.description}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="absolute top-3 right-3">
                        <CheckCircle className={`w-5 h-5 ${colors.icon}`} />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Add to Folder Button */}
          {result && !isGenerating && selectedDoc && (
            <div className={`p-4 rounded-xl border-2 transition-all duration-500 ${
              (() => {
                const colorClasses = {
                  red: 'border-red-500 bg-red-50 dark:bg-red-900/20',
                  orange: 'border-orange-500 bg-orange-50 dark:bg-orange-900/20',
                  green: 'border-green-500 bg-green-50 dark:bg-green-900/20',
                  purple: 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                };
                return colorClasses[selectedDoc.color];
              })()
            } animate-in fade-in`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  (() => {
                    const iconColorClasses = {
                      red: 'bg-red-100 dark:bg-red-800/30',
                      orange: 'bg-orange-100 dark:bg-orange-800/30',
                      green: 'bg-green-100 dark:bg-green-800/30',
                      purple: 'bg-purple-100 dark:bg-purple-800/30'
                    };
                    return iconColorClasses[selectedDoc.color];
                  })()
                } shadow-sm`}>
                  <FileCheck className={`w-5 h-5 ${
                    (() => {
                      const textColorClasses = {
                        red: 'text-red-600 dark:text-red-400',
                        orange: 'text-orange-600 dark:text-orange-400',
                        green: 'text-green-600 dark:text-green-400',
                        purple: 'text-purple-600 dark:text-purple-400'
                      };
                      return textColorClasses[selectedDoc.color];
                    })()
                  }`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                    Document généré
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                    {result.filename}
                  </p>
                  <button
                    onClick={addToFolder}
                    disabled={isSaving}
                    className={`w-full px-4 py-2 font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm ${
                      isSaving
                        ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
                        : (() => {
                            const btnColorClasses = {
                              red: 'bg-red-600 hover:bg-red-700 text-white hover:shadow-lg',
                              orange: 'bg-orange-600 hover:bg-orange-700 text-white hover:shadow-lg',
                              green: 'bg-green-600 hover:bg-green-700 text-white hover:shadow-lg',
                              purple: 'bg-purple-600 hover:bg-purple-700 text-white hover:shadow-lg'
                            };
                            return btnColorClasses[selectedDoc.color];
                          })()
                    }`}
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Ajout en cours...
                      </>
                    ) : (
                      <>
                        <FolderPlus className="w-4 h-4" />
                        Ajouter Au Dossier
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          {result && !isGenerating && !isSaving && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Information
              </h4>
              <p className="text-xs text-blue-800 dark:text-blue-200">
                Vérifiez l'aperçu du document, puis cliquez sur "Ajouter Au Dossier" pour le sauvegarder dans l'onglet Documents Interne.
              </p>
            </div>
          )}
        </div>

        {/* Right Column - Document Preview */}
        <div className="lg:col-span-3">
          {/* Loading State */}
          {isGenerating && (
            <div className="flex items-center justify-center h-full min-h-[600px] bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700">
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-blue-200 rounded-full"></div>
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                  Génération en cours...
                </p>
              </div>
            </div>
          )}

          {/* Preview */}
          {result && !isGenerating && (
            <div className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden shadow-lg animate-in fade-in duration-500">
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3 border-b border-slate-200">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Aperçu du document
                </h3>
              </div>
              <div className="bg-white p-4">
                <iframe
                  srcDoc={result.html.body}
                  className="w-full h-[700px] border border-slate-200 rounded bg-white shadow-inner"
                  title="Aperçu du document"
                  style={{ backgroundColor: 'white' }}
                />
              </div>
            </div>
          )}

          {/* Empty State */}
          {!selectedType && !isGenerating && (
            <div className="flex flex-col items-center justify-center h-full min-h-[600px] bg-white dark:bg-slate-800 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600">
              <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-2xl flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Sélectionnez un type de document
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md text-center px-4">
                Choisissez le type de document à gauche. Le document sera créé automatiquement et prêt à télécharger.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default D3EDocGenerator;
