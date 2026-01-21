import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ChevronLeft, ChevronRight, User, Clock, Sun, Moon,
  Check, X, Calendar, AlertCircle, Coffee, GraduationCap,
  Umbrella, Heart, Briefcase, Save, Loader2, RefreshCw, Trash2, PenTool
} from 'lucide-react';

const API_URL = 'https://valotik-api-546691893264.europe-west1.run.app/api';

// Types
interface Employee {
  id: string;
  nom: string;
  prenom: string;
  civilite: string;
  dureeHebdo: number;
  poste?: string;
  dateEntree: string;
}

interface PointageJournalier {
  id: string;
  date: string;
  heureDebut?: string;
  heureFin?: string;
  pauseMinutes: number;
  heuresTravaillees: number;
  typeJournee: string;
  motifAbsence?: string;
  notes?: string;
}

interface PointageMensuel {
  id: string;
  employeeId: string;
  mois: number;
  annee: number;
  heuresContrat: number;
  heuresPointees: number;
  heuresBanqueEntree: number;
  heuresBanqueSortie: number;
  pourcentage: number;
  journees: PointageJournalier[];
}

interface EmployeePointage {
  employee: Employee;
  pointage: PointageMensuel;
}

interface LocalPointage {
  matin: string;
  apresmidi: string;
  typeJournee: string;
  notes: string;
  saved: boolean;
}

// Format de date
const formatDate = (date: Date): string => {
  const jours = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const mois = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  return `${jours[date.getDay()]} ${date.getDate()} ${mois[date.getMonth()]} ${date.getFullYear()}`;
};

const formatDateISO = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatShortDate = (date: Date): string => {
  const jours = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  return `${jours[date.getDay()]} ${date.getDate()}`;
};

// Types de journée avec icônes
const typeJourneeOptions = [
  { value: 'travail', label: 'Travail', icon: Briefcase, color: 'emerald' },
  { value: 'conge', label: 'Congé', icon: Umbrella, color: 'blue' },
  { value: 'maladie', label: 'Maladie', icon: Heart, color: 'rose' },
  { value: 'formation', label: 'Formation', icon: GraduationCap, color: 'purple' },
  { value: 'ferie', label: 'Férié', icon: Calendar, color: 'amber' },
  { value: 'absence', label: 'Absence', icon: AlertCircle, color: 'orange' },
];

// Composant principal
export default function PointageMobileApp() {
  const [isDark, setIsDark] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [employees, setEmployees] = useState<EmployeePointage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [activeSheet, setActiveSheet] = useState<string | null>(null);
  const [localPointages, setLocalPointages] = useState<Record<string, LocalPointage>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const [signatures, setSignatures] = useState<Record<string, string>>({});
  const [isDrawing, setIsDrawing] = useState(false);

  // Couleurs dynamiques
  const bg = (dark: string, light: string) => isDark ? dark : light;
  const text = (dark: string, light: string) => isDark ? dark : light;

  // Charger les données du mois
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const mois = selectedDate.getMonth() + 1;
      const annee = selectedDate.getFullYear();

      const res = await fetch(`${API_URL}/pointage/mensuel?mois=${mois}&annee=${annee}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setEmployees(data.data.pointages || []);

          // Initialiser les pointages locaux pour la date sélectionnée
          const dateStr = formatDateISO(selectedDate);
          const initialLocal: Record<string, LocalPointage> = {};

          data.data.pointages.forEach((ep: EmployeePointage) => {
            const journee = ep.pointage.journees.find(
              (j: PointageJournalier) => j.date.split('T')[0] === dateStr
            );

            if (journee) {
              // Convertir heures travaillées en matin/après-midi
              const heures = journee.heuresTravaillees || 0;
              // Convention: max 4h matin, reste en après-midi
              const matin = Math.min(heures, 4);
              const apresmidi = Math.max(0, heures - 4);

              initialLocal[ep.employee.id] = {
                matin: journee.typeJournee === 'travail' ? matin.toString() : '',
                apresmidi: journee.typeJournee === 'travail' ? apresmidi.toString() : '',
                typeJournee: journee.typeJournee || 'travail',
                notes: journee.notes || '',
                saved: true
              };
            } else {
              initialLocal[ep.employee.id] = {
                matin: '',
                apresmidi: '',
                typeJournee: 'travail',
                notes: '',
                saved: true
              };
            }
          });

          setLocalPointages(initialLocal);
        }
      }
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Navigation dates
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Mettre à jour un pointage local
  const updateLocalPointage = (employeeId: string, field: keyof LocalPointage, value: string) => {
    setLocalPointages(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [field]: value,
        saved: false
      }
    }));
  };

  // Sauvegarder un pointage
  const savePointage = async (employeeId: string) => {
    const ep = employees.find(e => e.employee.id === employeeId);
    if (!ep) return;

    const local = localPointages[employeeId];
    if (!local) return;

    setSaving(prev => ({ ...prev, [employeeId]: true }));
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const matin = parseFloat(local.matin) || 0;
      const apresmidi = parseFloat(local.apresmidi) || 0;
      const heuresTravaillees = matin + apresmidi;

      // Calculer heureDebut et heureFin
      let heureDebut: string | null = null;
      let heureFin: string | null = null;

      if (local.typeJournee === 'travail' && heuresTravaillees > 0) {
        if (matin > 0) {
          heureDebut = '08:00';
          const matinFin = 8 + matin;
          if (apresmidi > 0) {
            heureFin = `${Math.floor(13 + apresmidi)}:${String(Math.round((apresmidi % 1) * 60)).padStart(2, '0')}`;
          } else {
            heureFin = `${Math.floor(matinFin)}:${String(Math.round((matinFin % 1) * 60)).padStart(2, '0')}`;
          }
        } else if (apresmidi > 0) {
          heureDebut = '13:00';
          const pmFin = 13 + apresmidi;
          heureFin = `${Math.floor(pmFin)}:${String(Math.round((pmFin % 1) * 60)).padStart(2, '0')}`;
        }
      }

      const payload = {
        pointageMensuelId: ep.pointage.id,
        date: formatDateISO(selectedDate),
        heureDebut,
        heureFin,
        pauseMinutes: matin > 0 && apresmidi > 0 ? 60 : 0,
        typeJournee: local.typeJournee,
        notes: local.notes || `Matin: ${matin}h, Après-midi: ${apresmidi}h`
      };

      const res = await fetch(`${API_URL}/pointage/journalier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setLocalPointages(prev => ({
          ...prev,
          [employeeId]: { ...prev[employeeId], saved: true }
        }));
        setSaveSuccess(employeeId);
        setTimeout(() => setSaveSuccess(null), 2000);
      } else {
        const error = await res.json();
        setSaveError(error.error || 'Erreur de sauvegarde');
      }
    } catch (error: any) {
      setSaveError(error.message || 'Erreur réseau');
    } finally {
      setSaving(prev => ({ ...prev, [employeeId]: false }));
    }
  };

  // Sauvegarder tous les pointages modifiés
  const saveAllPointages = async () => {
    const unsavedIds = Object.entries(localPointages)
      .filter(([_, p]) => !p.saved)
      .map(([id]) => id);

    for (const id of unsavedIds) {
      await savePointage(id);
    }
  };

  // Calculer les totaux du jour
  const getTotauxJour = () => {
    let heuresTotal = 0;
    let heuresContratTotal = 0;

    employees.forEach(ep => {
      const local = localPointages[ep.employee.id];
      if (local && local.typeJournee === 'travail') {
        const matin = parseFloat(local.matin) || 0;
        const apresmidi = parseFloat(local.apresmidi) || 0;
        heuresTotal += matin + apresmidi;
      }
      // Heures contractuelles par jour = dureeHebdo / 5
      heuresContratTotal += ep.employee.dureeHebdo / 5;
    });

    const pourcentage = heuresContratTotal > 0
      ? Math.round(heuresTotal / heuresContratTotal * 100)
      : 0;

    return { heuresTotal, heuresContratTotal, pourcentage };
  };

  // Vérifier si c'est un weekend
  const isWeekend = selectedDate.getDay() === 0 || selectedDate.getDay() === 6;

  // Compter les non sauvegardés
  const unsavedCount = Object.values(localPointages).filter(p => !p.saved).length;

  const totaux = getTotauxJour();

  // Fermer le bottom sheet au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(event.target as Node)) {
        setActiveSheet(null);
      }
    };

    if (activeSheet) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeSheet]);

  // Initialiser le canvas de signature quand le bottom sheet s'ouvre
  useEffect(() => {
    if (activeSheet && signatureCanvasRef.current) {
      const canvas = signatureCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Adapter la taille du canvas
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * 2;
        canvas.height = rect.height * 2;
        ctx.scale(2, 2);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 2;
        ctx.strokeStyle = isDark ? '#10b981' : '#059669';

        // Restaurer la signature existante si elle existe
        const existingSignature = signatures[activeSheet];
        if (existingSignature) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, rect.width, rect.height);
          };
          img.src = existingSignature;
        }
      }
    }
  }, [activeSheet, isDark]);

  // Fonctions de dessin pour la signature
  const getCoordinates = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const startDrawing = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const canvas = signatureCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = signatureCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    // Sauvegarder la signature
    const canvas = signatureCanvasRef.current;
    if (canvas && activeSheet) {
      const dataUrl = canvas.toDataURL('image/png');
      setSignatures(prev => ({ ...prev, [activeSheet]: dataUrl }));
    }
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    if (activeSheet) {
      setSignatures(prev => {
        const newSigs = { ...prev };
        delete newSigs[activeSheet];
        return newSigs;
      });
    }
  };

  return (
    <div className={`min-h-screen ${bg('bg-slate-900', 'bg-gray-100')} transition-colors duration-300`}>
      {/* Header */}
      <header className={`sticky top-0 z-40 ${bg('bg-slate-800', 'bg-white')} shadow-lg`}>
        <div className="px-4 py-3">
          {/* Titre et toggle theme */}
          <div className="flex justify-between items-center mb-3">
            <h1 className={`text-lg font-bold ${text('text-white', 'text-gray-900')}`}>
              Pointage Encadrant
            </h1>
            <button
              onClick={() => setIsDark(!isDark)}
              className={`p-2 rounded-full ${bg('bg-slate-700 hover:bg-slate-600', 'bg-gray-200 hover:bg-gray-300')}`}
            >
              {isDark ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-slate-600" />}
            </button>
          </div>

          {/* Navigation date */}
          <div className="flex items-center justify-between">
            <button
              onClick={goToPreviousDay}
              className={`p-2 rounded-lg ${bg('bg-slate-700 hover:bg-slate-600', 'bg-gray-200 hover:bg-gray-300')}`}
            >
              <ChevronLeft size={24} className={text('text-white', 'text-gray-700')} />
            </button>

            <button
              onClick={goToToday}
              className={`flex-1 mx-2 py-2 px-4 rounded-lg ${bg('bg-slate-700', 'bg-gray-200')}`}
            >
              <p className={`text-center font-semibold ${text('text-white', 'text-gray-900')}`}>
                {formatDate(selectedDate)}
              </p>
              {isWeekend && (
                <p className="text-center text-xs text-amber-500 font-medium">Weekend</p>
              )}
            </button>

            <button
              onClick={goToNextDay}
              className={`p-2 rounded-lg ${bg('bg-slate-700 hover:bg-slate-600', 'bg-gray-200 hover:bg-gray-300')}`}
            >
              <ChevronRight size={24} className={text('text-white', 'text-gray-700')} />
            </button>
          </div>
        </div>
      </header>

      {/* Message d'erreur */}
      {saveError && (
        <div className="mx-4 mt-2 p-3 bg-red-500/20 border border-red-500 rounded-lg">
          <p className="text-red-400 text-sm">{saveError}</p>
        </div>
      )}

      {/* Liste des employés */}
      <main className="px-4 py-4 pb-32">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className={`animate-spin ${text('text-white', 'text-gray-600')}`} size={40} />
          </div>
        ) : employees.length === 0 ? (
          <div className={`text-center py-20 ${text('text-gray-400', 'text-gray-500')}`}>
            <User size={48} className="mx-auto mb-4 opacity-50" />
            <p>Aucun employé actif</p>
          </div>
        ) : (
          <div className="space-y-3">
            {employees.map(ep => {
              const local = localPointages[ep.employee.id] || {
                matin: '',
                apresmidi: '',
                typeJournee: 'travail',
                notes: '',
                saved: true
              };

              const isSaving = saving[ep.employee.id];
              const isSuccess = saveSuccess === ep.employee.id;
              const heuresJour = (parseFloat(local.matin) || 0) + (parseFloat(local.apresmidi) || 0);
              const typeOption = typeJourneeOptions.find(t => t.value === local.typeJournee);
              const TypeIcon = typeOption?.icon || Briefcase;

              return (
                <div
                  key={ep.employee.id}
                  className={`rounded-xl ${bg('bg-slate-800', 'bg-white')} shadow-lg overflow-hidden transition-all duration-200 ${!local.saved ? 'ring-2 ring-amber-500' : ''}`}
                >
                  {/* En-tête employé */}
                  <div
                    className={`p-4 cursor-pointer ${bg('hover:bg-slate-700/50', 'hover:bg-gray-50')}`}
                    onClick={() => setActiveSheet(ep.employee.id)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${bg('bg-emerald-600', 'bg-emerald-500')}`}>
                          <User size={20} className="text-white" />
                        </div>
                        <div>
                          <p className={`font-semibold ${text('text-white', 'text-gray-900')}`}>
                            {ep.employee.prenom} {ep.employee.nom}
                          </p>
                          <p className={`text-xs ${text('text-gray-400', 'text-gray-500')}`}>
                            {ep.employee.poste || 'Agent'} - {ep.employee.dureeHebdo}h/sem
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {local.typeJournee !== 'travail' ? (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${typeOption?.color || 'gray'}-500/20 text-${typeOption?.color || 'gray'}-400`}>
                            {typeOption?.label}
                          </span>
                        ) : heuresJour > 0 ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">
                            {heuresJour}h
                          </span>
                        ) : (
                          <span className={`px-2 py-1 rounded-full text-xs ${text('text-gray-500 bg-gray-700/50', 'text-gray-400 bg-gray-200')}`}>
                            Non saisi
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Inputs inline matin/après-midi */}
                    {local.typeJournee === 'travail' && (
                      <div className="flex gap-3" onClick={e => e.stopPropagation()}>
                        <div className="flex-1">
                          <label className={`text-xs ${text('text-gray-400', 'text-gray-500')} mb-1 block`}>
                            Matin
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              inputMode="decimal"
                              step="0.5"
                              min="0"
                              max="5"
                              value={local.matin}
                              onChange={e => updateLocalPointage(ep.employee.id, 'matin', e.target.value)}
                              placeholder="0"
                              className={`w-full px-3 py-2 rounded-lg text-center font-semibold ${bg('bg-slate-700 text-white placeholder-gray-500', 'bg-gray-100 text-gray-900 placeholder-gray-400')} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                            />
                            <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs ${text('text-gray-500', 'text-gray-400')}`}>h</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <label className={`text-xs ${text('text-gray-400', 'text-gray-500')} mb-1 block`}>
                            Après-midi
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              inputMode="decimal"
                              step="0.5"
                              min="0"
                              max="5"
                              value={local.apresmidi}
                              onChange={e => updateLocalPointage(ep.employee.id, 'apresmidi', e.target.value)}
                              placeholder="0"
                              className={`w-full px-3 py-2 rounded-lg text-center font-semibold ${bg('bg-slate-700 text-white placeholder-gray-500', 'bg-gray-100 text-gray-900 placeholder-gray-400')} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                            />
                            <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs ${text('text-gray-500', 'text-gray-400')}`}>h</span>
                          </div>
                        </div>
                        <div className="flex items-end">
                          <button
                            onClick={() => savePointage(ep.employee.id)}
                            disabled={local.saved || isSaving}
                            className={`p-2 rounded-lg transition-all ${local.saved
                              ? isSuccess
                                ? 'bg-emerald-500 text-white'
                                : bg('bg-slate-600 text-gray-500', 'bg-gray-200 text-gray-400')
                              : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                              }`}
                          >
                            {isSaving ? (
                              <Loader2 size={20} className="animate-spin" />
                            ) : isSuccess ? (
                              <Check size={20} />
                            ) : (
                              <Save size={20} />
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Tags rapides pour absences */}
                    {local.typeJournee !== 'travail' && (
                      <div className="flex items-center justify-between">
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${bg(`bg-${typeOption?.color}-500/20`, `bg-${typeOption?.color}-100`)}`}>
                          <TypeIcon size={16} className={`text-${typeOption?.color}-500`} />
                          <span className={`text-sm font-medium text-${typeOption?.color}-${isDark ? '400' : '600'}`}>
                            {typeOption?.label}
                          </span>
                        </div>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            savePointage(ep.employee.id);
                          }}
                          disabled={local.saved || isSaving}
                          className={`p-2 rounded-lg transition-all ${local.saved
                            ? bg('bg-slate-600 text-gray-500', 'bg-gray-200 text-gray-400')
                            : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                            }`}
                        >
                          {isSaving ? (
                            <Loader2 size={20} className="animate-spin" />
                          ) : (
                            <Save size={20} />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer stats */}
      <footer className={`fixed bottom-0 left-0 right-0 ${bg('bg-slate-800', 'bg-white')} border-t ${bg('border-slate-700', 'border-gray-200')} shadow-lg`}>
        <div className="px-4 py-3">
          {/* Stats */}
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className={`text-xs ${text('text-gray-400', 'text-gray-500')}`}>Total du jour</p>
              <p className={`text-lg font-bold ${text('text-white', 'text-gray-900')}`}>
                {totaux.heuresTotal.toFixed(1)}h / {totaux.heuresContratTotal.toFixed(1)}h
              </p>
            </div>
            <div className="text-right">
              <p className={`text-xs ${text('text-gray-400', 'text-gray-500')}`}>Taux</p>
              <p className={`text-lg font-bold ${totaux.pourcentage >= 95
                ? 'text-emerald-500'
                : totaux.pourcentage >= 80
                  ? 'text-amber-500'
                  : 'text-red-500'
                }`}>
                {totaux.pourcentage}%
              </p>
            </div>
          </div>

          {/* Bouton sauvegarder tout */}
          <button
            onClick={saveAllPointages}
            disabled={unsavedCount === 0}
            className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${unsavedCount > 0
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
              : bg('bg-slate-700 text-gray-500', 'bg-gray-200 text-gray-400')
              }`}
          >
            <Save size={20} />
            {unsavedCount > 0
              ? `Enregistrer tout (${unsavedCount})`
              : 'Tout est sauvegardé'
            }
          </button>
        </div>
      </footer>

      {/* Bottom Sheet détail */}
      {activeSheet && (
        <div className="fixed inset-0 z-50 flex items-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setActiveSheet(null)}
          />

          {/* Sheet */}
          <div
            ref={sheetRef}
            className={`relative w-full max-h-[85vh] overflow-y-auto rounded-t-3xl ${bg('bg-slate-800', 'bg-white')} animate-slide-up`}
          >
            {/* Handle */}
            <div className="sticky top-0 py-3 flex justify-center">
              <div className={`w-12 h-1.5 rounded-full ${bg('bg-slate-600', 'bg-gray-300')}`} />
            </div>

            {(() => {
              const ep = employees.find(e => e.employee.id === activeSheet);
              if (!ep) return null;

              const local = localPointages[ep.employee.id] || {
                matin: '',
                apresmidi: '',
                typeJournee: 'travail',
                notes: '',
                saved: true
              };

              return (
                <div className="px-6 pb-8">
                  {/* Header employé */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${bg('bg-emerald-600', 'bg-emerald-500')}`}>
                      <User size={28} className="text-white" />
                    </div>
                    <div>
                      <h2 className={`text-xl font-bold ${text('text-white', 'text-gray-900')}`}>
                        {ep.employee.prenom} {ep.employee.nom}
                      </h2>
                      <p className={`${text('text-gray-400', 'text-gray-500')}`}>
                        {ep.employee.poste || 'Agent'} - {ep.employee.dureeHebdo}h/sem
                      </p>
                    </div>
                  </div>

                  {/* Date */}
                  <div className={`flex items-center gap-2 mb-6 px-4 py-3 rounded-xl ${bg('bg-slate-700', 'bg-gray-100')}`}>
                    <Calendar size={20} className={text('text-gray-400', 'text-gray-500')} />
                    <span className={text('text-white', 'text-gray-900')}>{formatDate(selectedDate)}</span>
                  </div>

                  {/* Heures matin/après-midi */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className={`text-sm font-medium ${text('text-gray-300', 'text-gray-700')} mb-2 block`}>
                        Matin
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          inputMode="decimal"
                          step="0.5"
                          min="0"
                          max="5"
                          value={local.matin}
                          onChange={e => updateLocalPointage(ep.employee.id, 'matin', e.target.value)}
                          placeholder="0"
                          disabled={local.typeJournee !== 'travail'}
                          className={`w-full px-4 py-4 rounded-xl text-center text-2xl font-bold ${bg('bg-slate-700 text-white disabled:opacity-50', 'bg-gray-100 text-gray-900 disabled:opacity-50')} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                        />
                        <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-lg ${text('text-gray-500', 'text-gray-400')}`}>h</span>
                      </div>
                    </div>
                    <div>
                      <label className={`text-sm font-medium ${text('text-gray-300', 'text-gray-700')} mb-2 block`}>
                        Après-midi
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          inputMode="decimal"
                          step="0.5"
                          min="0"
                          max="5"
                          value={local.apresmidi}
                          onChange={e => updateLocalPointage(ep.employee.id, 'apresmidi', e.target.value)}
                          placeholder="0"
                          disabled={local.typeJournee !== 'travail'}
                          className={`w-full px-4 py-4 rounded-xl text-center text-2xl font-bold ${bg('bg-slate-700 text-white disabled:opacity-50', 'bg-gray-100 text-gray-900 disabled:opacity-50')} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                        />
                        <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-lg ${text('text-gray-500', 'text-gray-400')}`}>h</span>
                      </div>
                    </div>
                  </div>

                  {/* Type de journée */}
                  <div className="mb-6">
                    <label className={`text-sm font-medium ${text('text-gray-300', 'text-gray-700')} mb-3 block`}>
                      Type de journée
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {typeJourneeOptions.map(option => {
                        const Icon = option.icon;
                        const isSelected = local.typeJournee === option.value;

                        return (
                          <button
                            key={option.value}
                            onClick={() => updateLocalPointage(ep.employee.id, 'typeJournee', option.value)}
                            className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${isSelected
                              ? `bg-${option.color}-500 text-white`
                              : bg(`bg-slate-700 text-gray-400 hover:bg-slate-600`, `bg-gray-100 text-gray-600 hover:bg-gray-200`)
                              }`}
                          >
                            <Icon size={20} />
                            <span className="text-xs font-medium">{option.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="mb-6">
                    <label className={`text-sm font-medium ${text('text-gray-300', 'text-gray-700')} mb-2 block`}>
                      Note (optionnel)
                    </label>
                    <textarea
                      value={local.notes}
                      onChange={e => updateLocalPointage(ep.employee.id, 'notes', e.target.value)}
                      placeholder="Ajouter une note..."
                      rows={2}
                      className={`w-full px-4 py-3 rounded-xl ${bg('bg-slate-700 text-white placeholder-gray-500', 'bg-gray-100 text-gray-900 placeholder-gray-400')} focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none`}
                    />
                  </div>

                  {/* Signature du salarié */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <label className={`text-sm font-medium ${text('text-gray-300', 'text-gray-700')} flex items-center gap-2`}>
                        <PenTool size={16} />
                        Signature du salarié
                      </label>
                      <button
                        onClick={clearSignature}
                        className={`p-2 rounded-lg ${bg('bg-slate-700 hover:bg-slate-600', 'bg-gray-200 hover:bg-gray-300')} transition-colors`}
                      >
                        <Trash2 size={16} className={text('text-gray-400', 'text-gray-500')} />
                      </button>
                    </div>
                    <div className={`relative rounded-xl overflow-hidden ${bg('bg-slate-700', 'bg-gray-100')} border-2 border-dashed ${signatures[ep.employee.id] ? 'border-emerald-500' : bg('border-slate-600', 'border-gray-300')}`}>
                      <canvas
                        ref={signatureCanvasRef}
                        className="w-full h-32 touch-none cursor-crosshair"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                      />
                      {!signatures[ep.employee.id] && (
                        <div className={`absolute inset-0 flex items-center justify-center pointer-events-none ${text('text-gray-500', 'text-gray-400')}`}>
                          <span className="text-sm">Signez ici</span>
                        </div>
                      )}
                    </div>
                    {signatures[ep.employee.id] && (
                      <p className="mt-1 text-xs text-emerald-500 flex items-center gap-1">
                        <Check size={12} /> Signature enregistrée
                      </p>
                    )}
                  </div>

                  {/* Bouton valider */}
                  <button
                    onClick={() => {
                      savePointage(ep.employee.id);
                      setTimeout(() => setActiveSheet(null), 500);
                    }}
                    disabled={saving[ep.employee.id]}
                    className="w-full py-4 rounded-xl font-semibold bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center gap-2 transition-all"
                  >
                    {saving[ep.employee.id] ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <Check size={20} />
                    )}
                    Valider
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Styles pour l'animation */}
      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
