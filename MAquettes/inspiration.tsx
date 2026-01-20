import React, { useState } from 'react';
import { Calendar, Package, FileText, Truck, Map, BarChart3, FileCheck, Settings, Search, Bell, Plus, ChevronRight, MapPin, AlertCircle, CheckCircle2, Clock, Users } from 'lucide-react';

const D3ECollectionApp = () => {
  const [activeTab, setActiveTab] = useState('synthese');
  const [selectedCase, setSelectedCase] = useState(null);
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [formData, setFormData] = useState({
    client: '',
    site: '',
    contact: '',
    description: '',
    categoriePrincipale: '',
    volumeEstime: '',
    priorite: 'medium',
    datePrevisionnelle: ''
  });

  const cases = [
    { id: 'CF-2025-001', client: 'CIRCET DISTRIBUTION PARIS', site: 'GEX', status: 'diagnostic', priority: 'high', weight: 2.4, createdAt: '2025-10-10' },
    { id: 'CF-2025-002', client: 'CESSY', site: 'DIVONNE LES BAINS', status: 'planifie', priority: 'medium', weight: 1.8, createdAt: '2025-10-12' },
    { id: 'CF-2025-003', client: 'GEX', site: 'GRILLY', status: 'enleve', priority: 'low', weight: 3.2, createdAt: '2025-10-08' },
  ];

  const statusColors = {
    'a-diagnostiquer': 'bg-purple-500',
    'planifie': 'bg-blue-500',
    'diagnostic': 'bg-cyan-500',
    'devis': 'bg-yellow-500',
    'enleve': 'bg-green-500',
    'cloture': 'bg-gray-500'
  };

  const tabs = [
    { id: 'synthese', label: 'Synthèse', icon: BarChart3 },
    { id: 'demande', label: 'Demande & Diagnostic', icon: FileText },
    { id: 'devis', label: 'Devis', icon: FileCheck },
    { id: 'logistique', label: 'Logistique', icon: Truck },
    { id: 'inventaire', label: 'Inventaire', icon: Package },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  const kpis = [
    { label: 'Poids Estimé', value: '2.4t', subvalue: 'vs 2.6t réel', trend: '+8%' },
    { label: 'Lots', value: '12', subvalue: '8 diagnostiqués', trend: null },
    { label: 'Valeur Estimée', value: '€3,240', subvalue: 'Grade A: 65%', trend: '+12%' },
    { label: 'Statut Devis', value: 'Validé', subvalue: 'Accepté client', trend: null }
  ];

  const timeline = [
    { step: 'Demande', status: 'completed', date: '10/10/2025' },
    { step: 'Diagnostic', status: 'completed', date: '12/10/2025' },
    { step: 'Devis', status: 'active', date: '15/10/2025' },
    { step: 'Collecte', status: 'pending', date: '18/10/2025' },
    { step: 'Réception', status: 'pending', date: null },
    { step: 'Clôture', status: 'pending', date: null }
  ];

  const lots = [
    { id: 'LOT-001', category: 'Informatique', grade: 'A', weight: 0.8, orientation: 'Revente', status: 'diagnostique' },
    { id: 'LOT-002', category: 'Câbles', grade: 'B', weight: 1.2, orientation: 'Démantèlement', status: 'diagnostique' },
    { id: 'LOT-003', category: 'Écrans', grade: 'A', weight: 0.4, orientation: 'Reconditionnement', status: 'diagnostique' }
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans">
      {/* Sidebar */}
      <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-6 h-6 text-cyan-400" />
            <h1 className="text-lg font-semibold">D3E Collecte</h1>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-slate-400 uppercase">Dossiers</h2>
            <button className="p-1 hover:bg-slate-800 rounded">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          {cases.map(caseItem => (
            <div
              key={caseItem.id}
              onClick={() => setSelectedCase(caseItem)}
              className={`p-3 mb-2 rounded-lg cursor-pointer transition-all ${
                selectedCase?.id === caseItem.id ? 'bg-slate-800 border border-cyan-500' : 'bg-slate-850 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-sm font-semibold text-cyan-400">{caseItem.id}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{caseItem.client}</div>
                </div>
                <div className={`w-2 h-2 rounded-full ${statusColors[caseItem.status]}`}></div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">{caseItem.site}</span>
                <span className="text-slate-400">{caseItem.weight}t</span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
              JD
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">Jean Dupont</div>
              <div className="text-xs text-slate-400">Planificateur</div>
            </div>
            <Settings className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-200" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 border-b border-slate-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>Clients</span>
              <ChevronRight className="w-4 h-4" />
              <span>CIRCET DISTRIBUTION PARIS</span>
              <ChevronRight className="w-4 h-4" />
              <span className="text-slate-200">Dossier CF-2025-001</span>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-sm font-medium transition-colors">
                <Plus className="w-4 h-4" />
                Créer Devis
              </button>
              <Bell className="w-5 h-5 text-slate-400 cursor-pointer hover:text-slate-200" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-xs text-yellow-400">
              <Clock className="w-3 h-3" />
              Devis à valider
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-xs text-green-400">
              <CheckCircle2 className="w-3 h-3" />
              Diagnostic complété
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-slate-900 border-b border-slate-800 px-4">
          <div className="flex gap-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
                    activeTab === tab.id
                      ? 'text-cyan-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950">
          {activeTab === 'synthese' && (
            <div className="space-y-6">
              {/* KPIs */}
              <div className="grid grid-cols-4 gap-4">
                {kpis.map((kpi, idx) => (
                  <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="text-xs text-slate-400 mb-1">{kpi.label}</div>
                    <div className="text-2xl font-bold text-slate-100 mb-1">{kpi.value}</div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-slate-500">{kpi.subvalue}</div>
                      {kpi.trend && (
                        <div className="text-xs text-green-400 font-medium">{kpi.trend}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Timeline */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-sm font-semibold mb-4 text-slate-300">Timeline du Dossier</h3>
                <div className="flex items-center justify-between relative">
                  <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-700"></div>
                  {timeline.map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center relative z-10">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                        item.status === 'completed' ? 'bg-green-500' :
                        item.status === 'active' ? 'bg-cyan-500' :
                        'bg-slate-700'
                      }`}>
                        {item.status === 'completed' && <CheckCircle2 className="w-5 h-5" />}
                        {item.status === 'active' && <Clock className="w-5 h-5" />}
                      </div>
                      <div className="text-xs font-medium text-slate-300">{item.step}</div>
                      {item.date && (
                        <div className="text-xs text-slate-500 mt-1">{item.date}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Map and Next Actions */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-sm font-semibold mb-4 text-slate-300 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Sites
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">Site Client - GEX</div>
                        <div className="text-xs text-slate-400">01170 GEX, France</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">Entrepôt Central</div>
                        <div className="text-xs text-slate-400">Paris, France</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-sm font-semibold mb-4 text-slate-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Prochaines Actions
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <FileCheck className="w-4 h-4 text-yellow-400" />
                      <div className="flex-1 text-sm">Valider devis avant envoi</div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                      <Truck className="w-4 h-4 text-cyan-400" />
                      <div className="flex-1 text-sm">Planifier enlèvement</div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg">
                      <Users className="w-4 h-4 text-slate-400" />
                      <div className="flex-1 text-sm">Assigner technicien</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'demande' && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Informations de la Demande</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Client</label>
                    <div className="text-sm">CIRCET DISTRIBUTION PARIS</div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Site</label>
                    <div className="text-sm">GEX - 01170</div>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-slate-400 mb-1 block">Description</label>
                    <div className="text-sm">2 palettes matériel informatique + câbles électriques</div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Lots Diagnostiqués</h3>
                <div className="space-y-3">
                  {lots.map(lot => (
                    <div key={lot.id} className="flex items-center gap-4 p-4 bg-slate-800 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-cyan-400">{lot.id}</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            lot.grade === 'A' ? 'bg-green-500/20 text-green-400' :
                            lot.grade === 'B' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            Grade {lot.grade}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400">{lot.category} • {lot.orientation}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{lot.weight}t</div>
                        <div className="text-xs text-slate-400">Poids estimé</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default D3ECollectionApp;