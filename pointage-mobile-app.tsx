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
  heuresMatin: number;
  heuresApresmidi: number;
  heuresTravaillees: number;
  signatureMatin?: string;
  signatureApresmidi?: string;
  signatureMatinAt?: string;
  signatureApresmidiAt?: string;
  heureDebut?: string;
  heureFin?: string;
  pauseMinutes: number;
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
  matinSigne: boolean;
  apresmidiSigne: boolean;
  signatureMatinAt?: string;
  signatureApresmidiAt?: string;
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

            // Valeurs par défaut selon le jour de la semaine
            const dayOfWeek = selectedDate.getDay();
            // Lundi (1) à Jeudi (4) : matin 3h, après-midi 3.5h
            // Vendredi (5) et weekend (0, 6) : 0h
            const isLundiAJeudi = dayOfWeek >= 1 && dayOfWeek <= 4;
            const defaultMatin = isLundiAJeudi ? '3' : '';
            const defaultApresmidi = isLundiAJeudi ? '3.5' : '';

            if (journee) {
              // Utiliser les heures matin/après-midi stockées directement
              const matinSigne = !!journee.signatureMatin;
              const apresmidiSigne = !!journee.signatureApresmidi;

              initialLocal[ep.employee.id] = {
                // Si signé, utiliser la valeur stockée, sinon la valeur par défaut
                matin: matinSigne ? journee.heuresMatin.toString() : defaultMatin,
                apresmidi: apresmidiSigne ? journee.heuresApresmidi.toString() : defaultApresmidi,
                typeJournee: journee.typeJournee || 'travail',
                notes: journee.notes || '',
                matinSigne,
                apresmidiSigne,
                signatureMatinAt: journee.signatureMatinAt,
                signatureApresmidiAt: journee.signatureApresmidiAt
              };
            } else {
              initialLocal[ep.employee.id] = {
                matin: defaultMatin,
                apresmidi: defaultApresmidi,
                typeJournee: 'travail',
                notes: '',
                matinSigne: false,
                apresmidiSigne: false
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

  // Mettre à jour un pointage local (seulement si pas encore signé)
  const updateLocalPointage = (employeeId: string, field: keyof LocalPointage, value: string) => {
    const local = localPointages[employeeId];
    if (!local) return;

    // Ne pas modifier si déjà signé
    if (field === 'matin' && local.matinSigne) return;
    if (field === 'apresmidi' && local.apresmidiSigne) return;

    setLocalPointages(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [field]: value
      }
    }));
  };

  // Signer une période (matin ou après-midi)
  const signerPeriode = async (employeeId: string, periode: 'matin' | 'apresmidi', signature: string) => {
    const ep = employees.find(e => e.employee.id === employeeId);
    if (!ep) return;

    const local = localPointages[employeeId];
    if (!local) return;

    // Vérifier si déjà signé
    if (periode === 'matin' && local.matinSigne) {
      setSaveError('Le matin est déjà signé');
      return;
    }
    if (periode === 'apresmidi' && local.apresmidiSigne) {
      setSaveError("L'après-midi est déjà signé");
      return;
    }

    const savingKey = `${employeeId}_${periode}`;
    setSaving(prev => ({ ...prev, [savingKey]: true }));
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const heures = periode === 'matin'
        ? parseFloat(local.matin) || 0
        : parseFloat(local.apresmidi) || 0;

      const payload = {
        pointageMensuelId: ep.pointage.id,
        date: formatDateISO(selectedDate),
        periode,
        heures,
        signature
      };

      const res = await fetch(`${API_URL}/pointage/signer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setLocalPointages(prev => ({
          ...prev,
          [employeeId]: {
            ...prev[employeeId],
            [periode === 'matin' ? 'matinSigne' : 'apresmidiSigne']: true,
            [periode === 'matin' ? 'signatureMatinAt' : 'signatureApresmidiAt']: new Date().toISOString()
          }
        }));
        setSaveSuccess(savingKey);
        setTimeout(() => setSaveSuccess(null), 2000);
      } else {
        const error = await res.json();
        setSaveError(error.error || 'Erreur de signature');
      }
    } catch (error: any) {
      setSaveError(error.message || 'Erreur réseau');
    } finally {
      setSaving(prev => ({ ...prev, [savingKey]: false }));
    }
  };

  // Calculer les totaux du jour (seulement les heures signées)
  const getTotauxJour = () => {
    let heuresSignees = 0;
    let heuresNonSignees = 0;
    let heuresContratTotal = 0;

    employees.forEach(ep => {
      const local = localPointages[ep.employee.id];
      if (local && local.typeJournee === 'travail') {
        const matin = parseFloat(local.matin) || 0;
        const apresmidi = parseFloat(local.apresmidi) || 0;
        // Compter les heures signées
        if (local.matinSigne) heuresSignees += matin;
        else heuresNonSignees += matin;
        if (local.apresmidiSigne) heuresSignees += apresmidi;
        else heuresNonSignees += apresmidi;
      }
      // Heures contractuelles par jour = dureeHebdo / 5
      heuresContratTotal += ep.employee.dureeHebdo / 5;
    });

    const heuresTotal = heuresSignees + heuresNonSignees;
    const pourcentage = heuresContratTotal > 0
      ? Math.round(heuresTotal / heuresContratTotal * 100)
      : 0;

    return { heuresTotal, heuresSignees, heuresNonSignees, heuresContratTotal, pourcentage };
  };

  // Vérifier si c'est un weekend
  const isWeekend = selectedDate.getDay() === 0 || selectedDate.getDay() === 6;

  // Compter les périodes non signées
  const getSignatureStats = () => {
    let matinNonSignes = 0;
    let apresmidiNonSignes = 0;
    Object.values(localPointages).forEach(p => {
      if (!p.matinSigne && parseFloat(p.matin) > 0) matinNonSignes++;
      if (!p.apresmidiSigne && parseFloat(p.apresmidi) > 0) apresmidiNonSignes++;
    });
    return { matinNonSignes, apresmidiNonSignes, total: matinNonSignes + apresmidiNonSignes };
  };
  const signatureStats = getSignatureStats();

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
        // Couleur selon période : vert pour matin, bleu pour après-midi
        const isMatin = activeSheet.includes('_matin');
        ctx.strokeStyle = isMatin
          ? (isDark ? '#10b981' : '#059669')  // Emerald pour matin
          : (isDark ? '#3b82f6' : '#2563eb'); // Blue pour après-midi

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
                matinSigne: false,
                apresmidiSigne: false
              };

              const isSavingMatin = saving[`${ep.employee.id}_matin`];
              const isSavingApresmidi = saving[`${ep.employee.id}_apresmidi`];
              const isSuccessMatin = saveSuccess === `${ep.employee.id}_matin`;
              const isSuccessApresmidi = saveSuccess === `${ep.employee.id}_apresmidi`;
              const heuresJour = (parseFloat(local.matin) || 0) + (parseFloat(local.apresmidi) || 0);
              const typeOption = typeJourneeOptions.find(t => t.value === local.typeJournee);
              const TypeIcon = typeOption?.icon || Briefcase;

              // Statut global des signatures
              const toutSigne = local.matinSigne && local.apresmidiSigne;
              const partielSigne = local.matinSigne || local.apresmidiSigne;

              return (
                <div
                  key={ep.employee.id}
                  className={`rounded-xl ${bg('bg-slate-800', 'bg-white')} shadow-lg overflow-hidden transition-all duration-200 ${toutSigne ? 'ring-2 ring-emerald-500' : partielSigne ? 'ring-2 ring-amber-500' : ''}`}
                >
                  {/* En-tête employé */}
                  <div
                    className={`p-4 cursor-pointer ${bg('hover:bg-slate-700/50', 'hover:bg-gray-50')}`}
                    onClick={() => setActiveSheet(ep.employee.id)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${toutSigne ? 'bg-emerald-600' : partielSigne ? 'bg-amber-600' : bg('bg-slate-600', 'bg-gray-400')}`}>
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
                        ) : toutSigne ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 flex items-center gap-1">
                            <Check size={12} /> {heuresJour}h
                          </span>
                        ) : partielSigne ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400">
                            {local.matinSigne ? 'Matin' : 'PM'} signé
                          </span>
                        ) : heuresJour > 0 ? (
                          <span className={`px-2 py-1 rounded-full text-xs ${text('text-gray-500 bg-gray-700/50', 'text-gray-400 bg-gray-200')}`}>
                            À signer
                          </span>
                        ) : (
                          <span className={`px-2 py-1 rounded-full text-xs ${text('text-gray-500 bg-gray-700/50', 'text-gray-400 bg-gray-200')}`}>
                            Non saisi
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Inputs inline matin/après-midi avec boutons de signature */}
                    {local.typeJournee === 'travail' && (
                      <div className="space-y-3" onClick={e => e.stopPropagation()}>
                        {/* MATIN */}
                        <div className={`flex gap-2 items-end p-2 rounded-lg ${local.matinSigne ? 'bg-emerald-500/10' : bg('bg-slate-700/50', 'bg-gray-50')}`}>
                          <div className="flex-1">
                            <label className={`text-xs ${local.matinSigne ? 'text-emerald-500' : text('text-gray-400', 'text-gray-500')} mb-1 flex items-center gap-1`}>
                              <Sun size={12} /> Matin {local.matinSigne && <Check size={12} />}
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
                                disabled={local.matinSigne}
                                className={`w-full px-3 py-2 rounded-lg text-center font-semibold ${local.matinSigne
                                  ? 'bg-emerald-500/20 text-emerald-400 cursor-not-allowed'
                                  : bg('bg-slate-700 text-white placeholder-gray-500', 'bg-gray-100 text-gray-900 placeholder-gray-400')
                                } focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                              />
                              <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs ${text('text-gray-500', 'text-gray-400')}`}>h</span>
                            </div>
                          </div>
                          <button
                            onClick={() => setActiveSheet(`${ep.employee.id}_matin`)}
                            disabled={local.matinSigne || isSavingMatin}
                            className={`px-3 py-2 rounded-lg font-medium text-sm flex items-center gap-1 transition-all ${local.matinSigne
                              ? 'bg-emerald-500/20 text-emerald-400 cursor-not-allowed'
                              : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                            }`}
                          >
                            {isSavingMatin ? <Loader2 size={16} className="animate-spin" /> : isSuccessMatin ? <Check size={16} /> : <PenTool size={16} />}
                            {local.matinSigne ? 'Signé' : 'Signer'}
                          </button>
                        </div>

                        {/* APRÈS-MIDI */}
                        <div className={`flex gap-2 items-end p-2 rounded-lg ${local.apresmidiSigne ? 'bg-emerald-500/10' : bg('bg-slate-700/50', 'bg-gray-50')}`}>
                          <div className="flex-1">
                            <label className={`text-xs ${local.apresmidiSigne ? 'text-emerald-500' : text('text-gray-400', 'text-gray-500')} mb-1 flex items-center gap-1`}>
                              <Moon size={12} /> Après-midi {local.apresmidiSigne && <Check size={12} />}
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
                                disabled={local.apresmidiSigne}
                                className={`w-full px-3 py-2 rounded-lg text-center font-semibold ${local.apresmidiSigne
                                  ? 'bg-emerald-500/20 text-emerald-400 cursor-not-allowed'
                                  : bg('bg-slate-700 text-white placeholder-gray-500', 'bg-gray-100 text-gray-900 placeholder-gray-400')
                                } focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                              />
                              <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs ${text('text-gray-500', 'text-gray-400')}`}>h</span>
                            </div>
                          </div>
                          <button
                            onClick={() => setActiveSheet(`${ep.employee.id}_apresmidi`)}
                            disabled={local.apresmidiSigne || isSavingApresmidi}
                            className={`px-3 py-2 rounded-lg font-medium text-sm flex items-center gap-1 transition-all ${local.apresmidiSigne
                              ? 'bg-emerald-500/20 text-emerald-400 cursor-not-allowed'
                              : 'bg-blue-500 hover:bg-blue-600 text-white'
                            }`}
                          >
                            {isSavingApresmidi ? <Loader2 size={16} className="animate-spin" /> : isSuccessApresmidi ? <Check size={16} /> : <PenTool size={16} />}
                            {local.apresmidiSigne ? 'Signé' : 'Signer'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Tags rapides pour absences */}
                    {local.typeJournee !== 'travail' && (
                      <div className="flex items-center justify-center">
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${bg(`bg-${typeOption?.color}-500/20`, `bg-${typeOption?.color}-100`)}`}>
                          <TypeIcon size={16} className={`text-${typeOption?.color}-500`} />
                          <span className={`text-sm font-medium text-${typeOption?.color}-${isDark ? '400' : '600'}`}>
                            {typeOption?.label}
                          </span>
                        </div>
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
          <div className="flex justify-between items-center mb-2">
            <div>
              <p className={`text-xs ${text('text-gray-400', 'text-gray-500')}`}>Heures signées</p>
              <p className={`text-lg font-bold text-emerald-500`}>
                {totaux.heuresSignees.toFixed(1)}h
              </p>
            </div>
            <div className="text-center">
              <p className={`text-xs ${text('text-gray-400', 'text-gray-500')}`}>En attente</p>
              <p className={`text-lg font-bold text-amber-500`}>
                {totaux.heuresNonSignees.toFixed(1)}h
              </p>
            </div>
            <div className="text-right">
              <p className={`text-xs ${text('text-gray-400', 'text-gray-500')}`}>Contrat</p>
              <p className={`text-lg font-bold ${text('text-white', 'text-gray-900')}`}>
                {totaux.heuresContratTotal.toFixed(1)}h
              </p>
            </div>
          </div>

          {/* Indicateur signatures */}
          <div className={`py-2 px-3 rounded-xl ${signatureStats.total === 0
            ? 'bg-emerald-500/20'
            : 'bg-amber-500/20'
          }`}>
            <div className="flex items-center justify-center gap-2">
              {signatureStats.total === 0 ? (
                <>
                  <Check size={20} className="text-emerald-500" />
                  <span className="text-emerald-500 font-medium">Toutes les signatures sont complètes</span>
                </>
              ) : (
                <>
                  <PenTool size={20} className="text-amber-500" />
                  <span className="text-amber-500 font-medium">
                    {signatureStats.matinNonSignes > 0 && `${signatureStats.matinNonSignes} matin`}
                    {signatureStats.matinNonSignes > 0 && signatureStats.apresmidiNonSignes > 0 && ' + '}
                    {signatureStats.apresmidiNonSignes > 0 && `${signatureStats.apresmidiNonSignes} après-midi`}
                    {' à signer'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </footer>

      {/* Bottom Sheet pour signature matin/après-midi */}
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
              // Parse activeSheet pour extraire employeeId et période
              const [employeeId, periode] = activeSheet.includes('_')
                ? [activeSheet.split('_')[0], activeSheet.split('_')[1] as 'matin' | 'apresmidi']
                : [activeSheet, null];

              const ep = employees.find(e => e.employee.id === employeeId);
              if (!ep) return null;

              const local = localPointages[ep.employee.id] || {
                matin: '',
                apresmidi: '',
                typeJournee: 'travail',
                notes: '',
                matinSigne: false,
                apresmidiSigne: false
              };

              // Si pas de période, afficher le panneau de configuration (type de journée, notes)
              if (!periode) {
                const typeOption = typeJourneeOptions.find(t => t.value === local.typeJournee);

                // Fonction pour sauvegarder le type de journée
                const saveTypeJournee = async (type: string) => {
                  setSaving(prev => ({ ...prev, [employeeId]: true }));
                  try {
                    const payload = {
                      pointageMensuelId: ep.pointage.id,
                      date: formatDateISO(selectedDate),
                      typeJournee: type,
                      notes: local.notes
                    };

                    const res = await fetch(`${API_URL}/pointage/journalier`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload)
                    });

                    if (res.ok) {
                      setLocalPointages(prev => ({
                        ...prev,
                        [employeeId]: { ...prev[employeeId], typeJournee: type }
                      }));
                      setSaveSuccess(employeeId);
                      setTimeout(() => setSaveSuccess(null), 2000);
                    }
                  } catch (error) {
                    console.error('Erreur sauvegarde:', error);
                  } finally {
                    setSaving(prev => ({ ...prev, [employeeId]: false }));
                  }
                };

                // Fonction pour sauvegarder les notes
                const saveNotes = async () => {
                  setSaving(prev => ({ ...prev, [`${employeeId}_notes`]: true }));
                  try {
                    const payload = {
                      pointageMensuelId: ep.pointage.id,
                      date: formatDateISO(selectedDate),
                      typeJournee: local.typeJournee,
                      notes: local.notes
                    };

                    const res = await fetch(`${API_URL}/pointage/journalier`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload)
                    });

                    if (res.ok) {
                      setSaveSuccess(`${employeeId}_notes`);
                      setTimeout(() => setSaveSuccess(null), 2000);
                    }
                  } catch (error) {
                    console.error('Erreur sauvegarde notes:', error);
                  } finally {
                    setSaving(prev => ({ ...prev, [`${employeeId}_notes`]: false }));
                  }
                };

                return (
                  <div className="px-6 pb-8">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center ${bg('bg-slate-600', 'bg-gray-400')}`}>
                        <User size={28} className="text-white" />
                      </div>
                      <div>
                        <h2 className={`text-xl font-bold ${text('text-white', 'text-gray-900')}`}>
                          {ep.employee.prenom} {ep.employee.nom}
                        </h2>
                        <p className={`${text('text-gray-400', 'text-gray-500')}`}>
                          {formatDate(selectedDate)}
                        </p>
                      </div>
                    </div>

                    {/* Type de journée */}
                    <div className="mb-6">
                      <label className={`text-sm font-medium ${text('text-gray-300', 'text-gray-700')} mb-3 block`}>
                        Type de journée
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {typeJourneeOptions.map(option => {
                          const Icon = option.icon;
                          const isSelected = local.typeJournee === option.value;
                          const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
                            emerald: { bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500' },
                            blue: { bg: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500' },
                            rose: { bg: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500' },
                            purple: { bg: 'bg-purple-500', text: 'text-purple-400', border: 'border-purple-500' },
                            amber: { bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500' },
                            orange: { bg: 'bg-orange-500', text: 'text-orange-400', border: 'border-orange-500' }
                          };
                          const colors = colorClasses[option.color] || colorClasses.emerald;

                          return (
                            <button
                              key={option.value}
                              onClick={() => saveTypeJournee(option.value)}
                              disabled={saving[employeeId]}
                              className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                                isSelected
                                  ? `${colors.bg} text-white border-transparent`
                                  : `${bg('bg-slate-700 hover:bg-slate-600', 'bg-gray-100 hover:bg-gray-200')} ${colors.border} border-opacity-30`
                              }`}
                            >
                              <Icon size={18} className={isSelected ? 'text-white' : colors.text} />
                              <span className={`text-sm font-medium ${isSelected ? 'text-white' : text('text-gray-300', 'text-gray-700')}`}>
                                {option.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="mb-6">
                      <label className={`text-sm font-medium ${text('text-gray-300', 'text-gray-700')} mb-2 block`}>
                        Notes (optionnel)
                      </label>
                      <div className="relative">
                        <textarea
                          value={local.notes}
                          onChange={e => setLocalPointages(prev => ({
                            ...prev,
                            [employeeId]: { ...prev[employeeId], notes: e.target.value }
                          }))}
                          placeholder="Ajouter une note..."
                          rows={3}
                          className={`w-full px-4 py-3 rounded-xl ${bg('bg-slate-700 text-white placeholder-gray-500', 'bg-gray-100 text-gray-900 placeholder-gray-400')} focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none`}
                        />
                      </div>
                      {local.notes && (
                        <button
                          onClick={saveNotes}
                          disabled={saving[`${employeeId}_notes`]}
                          className={`mt-2 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                            saveSuccess === `${employeeId}_notes`
                              ? 'bg-emerald-500 text-white'
                              : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                          }`}
                        >
                          {saving[`${employeeId}_notes`] ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : saveSuccess === `${employeeId}_notes` ? (
                            <Check size={16} />
                          ) : (
                            <Save size={16} />
                          )}
                          {saveSuccess === `${employeeId}_notes` ? 'Sauvegardé' : 'Sauvegarder la note'}
                        </button>
                      )}
                    </div>

                    {/* Bouton fermer */}
                    <button
                      onClick={() => setActiveSheet(null)}
                      className={`w-full py-3 rounded-xl font-medium ${bg('bg-slate-700 text-gray-300 hover:bg-slate-600', 'bg-gray-100 text-gray-600 hover:bg-gray-200')} transition-all`}
                    >
                      Fermer
                    </button>
                  </div>
                );
              }

              const isMatin = periode === 'matin';
              const heures = isMatin ? local.matin : local.apresmidi;
              const savingKey = `${employeeId}_${periode}`;
              const isSaving = saving[savingKey];

              return (
                <div className="px-6 pb-8">
                  {/* Header */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isMatin ? 'bg-emerald-600' : 'bg-blue-600'}`}>
                      {isMatin ? <Sun size={28} className="text-white" /> : <Moon size={28} className="text-white" />}
                    </div>
                    <div>
                      <h2 className={`text-xl font-bold ${text('text-white', 'text-gray-900')}`}>
                        Signature {isMatin ? 'Matin' : 'Après-midi'}
                      </h2>
                      <p className={`${text('text-gray-400', 'text-gray-500')}`}>
                        {ep.employee.prenom} {ep.employee.nom}
                      </p>
                    </div>
                  </div>

                  {/* Date et heures */}
                  <div className={`flex items-center justify-between mb-6 px-4 py-3 rounded-xl ${bg('bg-slate-700', 'bg-gray-100')}`}>
                    <div className="flex items-center gap-2">
                      <Calendar size={20} className={text('text-gray-400', 'text-gray-500')} />
                      <span className={text('text-white', 'text-gray-900')}>{formatDate(selectedDate)}</span>
                    </div>
                    <div className={`px-3 py-1 rounded-lg ${isMatin ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'} font-bold`}>
                      {heures}h
                    </div>
                  </div>

                  {/* Message explicatif */}
                  <div className={`mb-6 p-4 rounded-xl ${bg('bg-slate-700/50', 'bg-gray-50')} border ${isMatin ? 'border-emerald-500/30' : 'border-blue-500/30'}`}>
                    <p className={`text-sm ${text('text-gray-300', 'text-gray-600')}`}>
                      En signant, je confirme avoir travaillé <strong>{heures}h</strong> {isMatin ? 'ce matin' : "cet après-midi"} le {formatDate(selectedDate)}.
                    </p>
                  </div>

                  {/* Zone de signature */}
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
                    <div className={`relative rounded-xl overflow-hidden ${bg('bg-slate-700', 'bg-gray-100')} border-2 border-dashed ${signatures[activeSheet] ? (isMatin ? 'border-emerald-500' : 'border-blue-500') : bg('border-slate-600', 'border-gray-300')}`}>
                      <canvas
                        ref={signatureCanvasRef}
                        className="w-full h-40 touch-none cursor-crosshair"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                      />
                      {!signatures[activeSheet] && (
                        <div className={`absolute inset-0 flex items-center justify-center pointer-events-none ${text('text-gray-500', 'text-gray-400')}`}>
                          <span className="text-sm">Signez ici avec votre doigt</span>
                        </div>
                      )}
                    </div>
                    {signatures[activeSheet] && (
                      <p className={`mt-1 text-xs ${isMatin ? 'text-emerald-500' : 'text-blue-500'} flex items-center gap-1`}>
                        <Check size={12} /> Signature prête
                      </p>
                    )}
                  </div>

                  {/* Bouton valider */}
                  <button
                    onClick={() => {
                      const sig = signatures[activeSheet];
                      if (!sig) {
                        setSaveError('Veuillez signer avant de valider');
                        return;
                      }
                      signerPeriode(employeeId, periode as 'matin' | 'apresmidi', sig);
                      setTimeout(() => setActiveSheet(null), 500);
                    }}
                    disabled={isSaving || !signatures[activeSheet]}
                    className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${signatures[activeSheet]
                      ? (isMatin ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-blue-500 hover:bg-blue-600') + ' text-white'
                      : bg('bg-slate-600 text-gray-500 cursor-not-allowed', 'bg-gray-200 text-gray-400 cursor-not-allowed')
                    }`}
                  >
                    {isSaving ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <Check size={20} />
                    )}
                    {signatures[activeSheet] ? `Valider ${isMatin ? 'Matin' : 'Après-midi'}` : 'Signez pour valider'}
                  </button>

                  {/* Bouton annuler */}
                  <button
                    onClick={() => setActiveSheet(null)}
                    className={`w-full mt-3 py-3 rounded-xl font-medium ${bg('bg-slate-700 text-gray-300 hover:bg-slate-600', 'bg-gray-100 text-gray-600 hover:bg-gray-200')} transition-all`}
                  >
                    Annuler
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
