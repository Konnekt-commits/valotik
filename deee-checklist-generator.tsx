import React, { useState } from 'react';
import { Wrench, Clock, Shield, Recycle, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle } from 'lucide-react';

const DismantlingChecklistGenerator = () => {
  const [jsonInput, setJsonInput] = useState('');
  const [checklist, setChecklist] = useState(null);
  const [expandedSteps, setExpandedSteps] = useState({});
  const [completedSteps, setCompletedSteps] = useState({});

  // Exemple de données JSON
  const exampleJson = {
    category: "equipements-informatiques",
    subcategory: "ordinateurs-portables",
    components: [
      { type: "batterie-lithium", weight: 0.3, material: "lithium-ion" },
      { type: "ecran-lcd", weight: 0.5, material: "verre-plastique" },
      { type: "carte-mere", weight: 0.2, material: "pcb-metaux" },
      { type: "disque-dur", weight: 0.15, material: "metaux-plastique" },
      { type: "coque-plastique", weight: 0.8, material: "abs-polycarbonate" },
      { type: "clavier", weight: 0.3, material: "plastique-silicone" },
      { type: "cables-connecteurs", weight: 0.1, material: "cuivre-plastique" }
    ]
  };

  const generateChecklist = (data) => {
    const steps = [];
    let stepNumber = 1;

    // Étape 1: Préparation et sécurité
    steps.push({
      step: stepNumber++,
      action: "Préparation de l'espace de travail et vérification des EPI",
      tools: ["Tapis antistatique", "Conteneurs de tri"],
      EPI: ["Gants de protection", "Lunettes de sécurité"],
      estimated_time_min: 3,
      output_stream: "preparation",
      eco_value: 0,
      priority: "high"
    });

    // Étape 2: Déconnexion et décharge
    if (data.components.some(c => c.type.includes("batterie"))) {
      steps.push({
        step: stepNumber++,
        action: "Déconnexion de l'alimentation et décharge des condensateurs (attendre 5 minutes)",
        tools: ["Multimètre"],
        EPI: ["Gants isolants", "Lunettes de sécurité"],
        estimated_time_min: 6,
        output_stream: "securite",
        eco_value: 0,
        priority: "critical"
      });
    }

    // Étape 3: Retrait de la batterie
    if (data.components.some(c => c.type.includes("batterie"))) {
      const battery = data.components.find(c => c.type.includes("batterie"));
      steps.push({
        step: stepNumber++,
        action: "Retrait de la batterie - Dévisser les fixations et débrancher le connecteur",
        tools: ["Tournevis cruciforme", "Spatule en plastique"],
        EPI: ["Gants isolants"],
        estimated_time_min: 4,
        output_stream: "batteries-lithium",
        eco_value: battery.weight * 15,
        priority: "critical"
      });
    }

    // Étape 4: Démontage de l'écran
    if (data.components.some(c => c.type.includes("ecran"))) {
      const screen = data.components.find(c => c.type.includes("ecran"));
      steps.push({
        step: stepNumber++,
        action: "Séparation de l'écran du châssis - Dévisser les charnières et déconnecter la nappe vidéo",
        tools: ["Tournevis torx T5", "Pince à bec fin"],
        EPI: ["Gants de protection", "Lunettes"],
        estimated_time_min: 8,
        output_stream: "DEEE-ecrans",
        eco_value: screen.weight * 8,
        priority: "medium"
      });
    }

    // Étape 5: Extraction des composants internes
    if (data.components.some(c => c.type.includes("carte-mere") || c.type.includes("disque"))) {
      steps.push({
        step: stepNumber++,
        action: "Retrait de la mémoire RAM, disque dur/SSD et carte WiFi",
        tools: ["Tournevis cruciforme", "Bracelet antistatique"],
        EPI: ["Gants antistatiques"],
        estimated_time_min: 7,
        output_stream: "composants-reemploi",
        eco_value: 25,
        priority: "high"
      });
    }

    // Étape 6: Démontage carte mère
    if (data.components.some(c => c.type.includes("carte-mere"))) {
      const pcb = data.components.find(c => c.type.includes("carte-mere"));
      steps.push({
        step: stepNumber++,
        action: "Extraction de la carte mère - Déconnecter tous les câbles et retirer les vis de fixation",
        tools: ["Tournevis cruciforme", "Pince coupante"],
        EPI: ["Gants de protection"],
        estimated_time_min: 10,
        output_stream: "metaux-precieux",
        eco_value: pcb.weight * 50,
        priority: "high"
      });
    }

    // Étape 7: Retrait des câbles
    if (data.components.some(c => c.type.includes("cable"))) {
      const cables = data.components.find(c => c.type.includes("cable"));
      steps.push({
        step: stepNumber++,
        action: "Récupération des câbles et connecteurs",
        tools: ["Pince coupante"],
        EPI: ["Gants de protection"],
        estimated_time_min: 3,
        output_stream: "cuivre-cables",
        eco_value: cables.weight * 12,
        priority: "low"
      });
    }

    // Étape 8: Démontage clavier/périphériques
    if (data.components.some(c => c.type.includes("clavier"))) {
      steps.push({
        step: stepNumber++,
        action: "Séparation du clavier et du trackpad",
        tools: ["Spatule plastique", "Tournevis plat"],
        EPI: ["Gants"],
        estimated_time_min: 5,
        output_stream: "plastiques-mixtes",
        eco_value: 5,
        priority: "low"
      });
    }

    // Étape 9: Séparation des plastiques
    if (data.components.some(c => c.type.includes("coque") || c.type.includes("plastique"))) {
      const plastics = data.components.filter(c => c.material.includes("plastique"));
      const totalPlastic = plastics.reduce((sum, p) => sum + p.weight, 0);
      steps.push({
        step: stepNumber++,
        action: "Démontage des coques plastiques et tri par type (ABS, PC, etc.)",
        tools: ["Tournevis", "Marqueur"],
        EPI: ["Gants"],
        estimated_time_min: 6,
        output_stream: "plastiques-tries",
        eco_value: totalPlastic * 6,
        priority: "medium"
      });
    }

    // Étape 10: Tri final
    steps.push({
      step: stepNumber++,
      action: "Contrôle qualité et tri final des matières dans les conteneurs appropriés",
      tools: ["Balance", "Étiquettes"],
      EPI: ["Gants"],
      estimated_time_min: 4,
      output_stream: "tri-final",
      eco_value: 10,
      priority: "medium"
    });

    // Calcul du résumé
    const totalTime = steps.reduce((sum, step) => sum + step.estimated_time_min, 0);
    const totalEcoValue = steps.reduce((sum, step) => sum + step.eco_value, 0);
    const totalWeight = data.components.reduce((sum, c) => sum + c.weight, 0);
    const recyclableWeight = totalWeight * 0.85;

    const summary = {
      total_time_min: totalTime,
      total_steps: steps.length,
      recyclable_percentage: Math.round((recyclableWeight / totalWeight) * 100),
      total_eco_value_kg_co2: Math.round(totalEcoValue * 10) / 10,
      main_streams: ["batteries-lithium", "metaux-precieux", "plastiques-tries", "DEEE-ecrans"],
      total_weight_kg: Math.round(totalWeight * 100) / 100
    };

    return { steps, summary };
  };

  const handleGenerate = () => {
    try {
      const data = jsonInput ? JSON.parse(jsonInput) : exampleJson;
      const result = generateChecklist(data);
      setChecklist(result);
      setCompletedSteps({});
    } catch (error) {
      alert("Erreur dans le JSON: " + error.message);
    }
  };

  const toggleStep = (stepNum) => {
    setExpandedSteps(prev => ({
      ...prev,
      [stepNum]: !prev[stepNum]
    }));
  };

  const toggleComplete = (stepNum) => {
    setCompletedSteps(prev => ({
      ...prev,
      [stepNum]: !prev[stepNum]
    }));
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'critical': return 'bg-red-100 border-red-400 text-red-800';
      case 'high': return 'bg-orange-100 border-orange-400 text-orange-800';
      case 'medium': return 'bg-blue-100 border-blue-400 text-blue-800';
      default: return 'bg-gray-100 border-gray-400 text-gray-800';
    }
  };

  const getStreamColor = (stream) => {
    if (stream.includes('batterie')) return 'text-red-600';
    if (stream.includes('metaux')) return 'text-yellow-600';
    if (stream.includes('plastique')) return 'text-blue-600';
    if (stream.includes('reemploi')) return 'text-green-600';
    return 'text-gray-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <Recycle className="text-green-600" size={36} />
            Générateur de Checklist Démontage D3E
          </h1>
          <p className="text-gray-600 mb-6">Générez une checklist interactive de démontage pas-à-pas pour vos équipements électroniques</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                JSON de l'équipement (ou laissez vide pour l'exemple ordinateur portable)
              </label>
              <textarea
                className="w-full h-40 p-3 border border-gray-300 rounded-lg font-mono text-sm"
                placeholder={JSON.stringify(exampleJson, null, 2)}
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
              />
            </div>
            
            <button
              onClick={handleGenerate}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Wrench size={20} />
              Générer la Checklist
            </button>
          </div>
        </div>

        {checklist && (
          <>
            <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg shadow-xl p-6 mb-6 text-white">
              <h2 className="text-2xl font-bold mb-4">Résumé du Démontage</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white bg-opacity-20 rounded-lg p-4">
                  <div className="text-sm opacity-90">Temps Total</div>
                  <div className="text-3xl font-bold">{checklist.summary.total_time_min} min</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-4">
                  <div className="text-sm opacity-90">Étapes</div>
                  <div className="text-3xl font-bold">{checklist.summary.total_steps}</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-4">
                  <div className="text-sm opacity-90">Valorisable</div>
                  <div className="text-3xl font-bold">{checklist.summary.recyclable_percentage}%</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-4">
                  <div className="text-sm opacity-90">CO₂ Évité</div>
                  <div className="text-3xl font-bold">{checklist.summary.total_eco_value_kg_co2} kg</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white border-opacity-30">
                <div className="text-sm opacity-90 mb-2">Filières principales:</div>
                <div className="flex flex-wrap gap-2">
                  {checklist.summary.main_streams.map((stream, idx) => (
                    <span key={idx} className="bg-white bg-opacity-30 px-3 py-1 rounded-full text-sm">
                      {stream}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Étapes de Démontage</h2>
              
              <div className="space-y-4">
                {checklist.steps.map((step) => (
                  <div key={step.step} className={`border-2 rounded-lg overflow-hidden transition-all ${
                    completedSteps[step.step] ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200'
                  }`}>
                    <div
                      className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleStep(step.step)}
                    >
                      <div className="flex items-start gap-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleComplete(step.step);
                          }}
                          className="mt-1 flex-shrink-0"
                        >
                          {completedSteps[step.step] ? (
                            <CheckCircle2 className="text-green-600" size={24} />
                          ) : (
                            <div className="w-6 h-6 border-2 border-gray-300 rounded-full" />
                          )}
                        </button>
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <span className="text-lg font-bold text-gray-700">Étape {step.step}</span>
                                <span className={`px-2 py-1 rounded text-xs font-semibold border ${getPriorityColor(step.priority)}`}>
                                  {step.priority === 'critical' ? 'CRITIQUE' : step.priority === 'high' ? 'HAUTE' : step.priority === 'medium' ? 'MOYENNE' : 'BASSE'}
                                </span>
                              </div>
                              <p className="text-gray-800 font-medium">{step.action}</p>
                            </div>
                            
                            <div className="flex items-center gap-2 text-gray-600">
                              <Clock size={16} />
                              <span className="text-sm font-semibold">{step.estimated_time_min} min</span>
                            </div>
                          </div>
                          
                          {!expandedSteps[step.step] && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Recycle size={14} />
                              <span className={`font-medium ${getStreamColor(step.output_stream)}`}>
                                {step.output_stream}
                              </span>
                              {step.eco_value > 0 && (
                                <span className="text-green-600 ml-2">
                                  +{step.eco_value} kg CO₂ évité
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {expandedSteps[step.step] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>
                    
                    {expandedSteps[step.step] && (
                      <div className="px-4 pb-4 pt-2 border-t border-gray-200 bg-gray-50">
                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                              <Wrench size={16} />
                              Outils Nécessaires
                            </div>
                            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                              {step.tools.map((tool, idx) => (
                                <li key={idx}>{tool}</li>
                              ))}
                            </ul>
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                              <Shield size={16} />
                              Équipements de Protection
                            </div>
                            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                              {step.EPI.map((epi, idx) => (
                                <li key={idx}>{epi}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Recycle size={16} className="text-green-600" />
                            <span className="font-medium text-gray-700">Destination:</span>
                            <span className={`font-semibold ${getStreamColor(step.output_stream)}`}>
                              {step.output_stream}
                            </span>
                          </div>
                          
                          {step.eco_value > 0 && (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-green-500 rounded-full" />
                              <span className="font-medium text-gray-700">Impact:</span>
                              <span className="font-semibold text-green-600">
                                {step.eco_value} kg CO₂ évité
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {step.priority === 'critical' && (
                          <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded p-3">
                            <AlertTriangle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-red-800">
                              <strong>Attention:</strong> Cette étape est critique pour la sécurité. Suivez scrupuleusement les consignes.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-center text-gray-600">
                  <strong>{Object.keys(completedSteps).filter(k => completedSteps[k]).length}</strong> sur <strong>{checklist.steps.length}</strong> étapes complétées
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DismantlingChecklistGenerator;