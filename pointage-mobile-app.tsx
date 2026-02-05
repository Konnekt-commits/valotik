import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ChevronLeft, ChevronRight, User, Clock, Sun, Moon,
  Check, X, Calendar, AlertCircle, Coffee, GraduationCap,
  Umbrella, Heart, Briefcase, Save, Loader2, RefreshCw, Trash2, PenTool,
  LogOut, FileText, Download
} from 'lucide-react';
import jsPDF from 'jspdf';

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
  const autorisationCanvasRef = useRef<HTMLCanvasElement>(null);
  const [signatures, setSignatures] = useState<Record<string, string>>({});
  const [isDrawing, setIsDrawing] = useState(false);

  // États pour autorisation de sortie
  const [showAutorisationForm, setShowAutorisationForm] = useState<string | null>(null);
  const [autorisationData, setAutorisationData] = useState({
    heureDebut: '',
    heureFin: '',
    motif: ''
  });
  const [autorisationSignature, setAutorisationSignature] = useState<string | null>(null);
  const [savingAutorisation, setSavingAutorisation] = useState(false);

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
  // Retourne true si succès, false si erreur
  const signerPeriode = async (employeeId: string, periode: 'matin' | 'apresmidi', signature: string): Promise<boolean> => {
    const ep = employees.find(e => e.employee.id === employeeId);
    if (!ep) {
      setSaveError('Employé non trouvé');
      return false;
    }

    const local = localPointages[employeeId];
    if (!local) {
      setSaveError('Pointage non initialisé');
      return false;
    }

    // Vérifier si déjà signé
    if (periode === 'matin' && local.matinSigne) {
      setSaveError('Le matin est déjà signé');
      return false;
    }
    if (periode === 'apresmidi' && local.apresmidiSigne) {
      setSaveError("L'après-midi est déjà signé");
      return false;
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

      console.log('Envoi signature:', payload.pointageMensuelId, payload.date, payload.periode, payload.heures);

      const res = await fetch(`${API_URL}/pointage/signer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        console.log('Signature enregistrée avec succès');
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
        return true;
      } else {
        const error = await res.json();
        console.error('Erreur serveur:', error);
        setSaveError(error.error || 'Erreur de signature');
        return false;
      }
    } catch (error: any) {
      console.error('Erreur réseau:', error);
      setSaveError(error.message || 'Erreur réseau');
      return false;
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

              // Si pas de période (clic sur la carte), afficher le panneau complet
              if (!periode) {
                const typeOption = typeJourneeOptions.find(t => t.value === local.typeJournee);

                // Fonction pour sauvegarder le type de journée et les notes
                const saveTypeAndNotes = async (type?: string) => {
                  setSaving(prev => ({ ...prev, [employeeId]: true }));
                  try {
                    const payload = {
                      pointageMensuelId: ep.pointage.id,
                      date: formatDateISO(selectedDate),
                      typeJournee: type || local.typeJournee,
                      notes: local.notes
                    };

                    const res = await fetch(`${API_URL}/pointage/journalier`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload)
                    });

                    if (res.ok) {
                      if (type) {
                        setLocalPointages(prev => ({
                          ...prev,
                          [employeeId]: { ...prev[employeeId], typeJournee: type }
                        }));
                      }
                      setSaveSuccess(employeeId);
                      setTimeout(() => setSaveSuccess(null), 2000);
                    }
                  } catch (error) {
                    console.error('Erreur sauvegarde:', error);
                  } finally {
                    setSaving(prev => ({ ...prev, [employeeId]: false }));
                  }
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
                              onClick={() => saveTypeAndNotes(option.value)}
                              disabled={saving[employeeId]}
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
                        onChange={e => setLocalPointages(prev => ({
                          ...prev,
                          [employeeId]: { ...prev[employeeId], notes: e.target.value }
                        }))}
                        placeholder="Ajouter une note..."
                        rows={2}
                        className={`w-full px-4 py-3 rounded-xl ${bg('bg-slate-700 text-white placeholder-gray-500', 'bg-gray-100 text-gray-900 placeholder-gray-400')} focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none`}
                      />
                      {local.notes && (
                        <button
                          onClick={() => saveTypeAndNotes()}
                          disabled={saving[employeeId]}
                          className="mt-2 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white"
                        >
                          {saving[employeeId] ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                          Sauvegarder
                        </button>
                      )}
                    </div>

                    {/* Boutons de signature matin/après-midi (si type = travail) */}
                    {local.typeJournee === 'travail' && (
                      <div className="mb-6 space-y-3">
                        <label className={`text-sm font-medium ${text('text-gray-300', 'text-gray-700')} block`}>
                          Signatures
                        </label>

                        {/* Bouton Signer Matin */}
                        <button
                          onClick={() => setActiveSheet(`${employeeId}_matin`)}
                          disabled={local.matinSigne}
                          className={`w-full p-4 rounded-xl flex items-center justify-between transition-all ${
                            local.matinSigne
                              ? 'bg-emerald-500/20 border-2 border-emerald-500'
                              : 'bg-emerald-500 hover:bg-emerald-600'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Sun size={24} className={local.matinSigne ? 'text-emerald-500' : 'text-white'} />
                            <div className="text-left">
                              <p className={`font-semibold ${local.matinSigne ? 'text-emerald-500' : 'text-white'}`}>
                                Matin - {local.matin}h
                              </p>
                              <p className={`text-xs ${local.matinSigne ? 'text-emerald-400' : 'text-emerald-100'}`}>
                                {local.matinSigne ? 'Signé ✓' : 'Cliquez pour signer'}
                              </p>
                            </div>
                          </div>
                          {local.matinSigne ? (
                            <Check size={24} className="text-emerald-500" />
                          ) : (
                            <PenTool size={24} className="text-white" />
                          )}
                        </button>

                        {/* Bouton Signer Après-midi */}
                        <button
                          onClick={() => setActiveSheet(`${employeeId}_apresmidi`)}
                          disabled={local.apresmidiSigne}
                          className={`w-full p-4 rounded-xl flex items-center justify-between transition-all ${
                            local.apresmidiSigne
                              ? 'bg-blue-500/20 border-2 border-blue-500'
                              : 'bg-blue-500 hover:bg-blue-600'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Moon size={24} className={local.apresmidiSigne ? 'text-blue-500' : 'text-white'} />
                            <div className="text-left">
                              <p className={`font-semibold ${local.apresmidiSigne ? 'text-blue-500' : 'text-white'}`}>
                                Après-midi - {local.apresmidi}h
                              </p>
                              <p className={`text-xs ${local.apresmidiSigne ? 'text-blue-400' : 'text-blue-100'}`}>
                                {local.apresmidiSigne ? 'Signé ✓' : 'Cliquez pour signer'}
                              </p>
                            </div>
                          </div>
                          {local.apresmidiSigne ? (
                            <Check size={24} className="text-blue-500" />
                          ) : (
                            <PenTool size={24} className="text-white" />
                          )}
                        </button>
                      </div>
                    )}

                    {/* Section Autorisation de sortie */}
                    {local.typeJournee === 'travail' && (
                      <div className="mb-6">
                        <button
                          onClick={() => setShowAutorisationForm(showAutorisationForm === employeeId ? null : employeeId)}
                          className={`w-full p-4 rounded-xl flex items-center justify-between transition-all ${bg('bg-orange-500/20 hover:bg-orange-500/30', 'bg-orange-100 hover:bg-orange-200')} border-2 border-orange-500/50`}
                        >
                          <div className="flex items-center gap-3">
                            <LogOut size={24} className="text-orange-500" />
                            <div className="text-left">
                              <p className="font-semibold text-orange-500">Autorisation de sortie</p>
                              <p className={`text-xs ${text('text-orange-400', 'text-orange-600')}`}>
                                Sortie anticipée avec signature
                              </p>
                            </div>
                          </div>
                          <ChevronRight size={24} className={`text-orange-500 transition-transform ${showAutorisationForm === employeeId ? 'rotate-90' : ''}`} />
                        </button>

                        {/* Formulaire autorisation de sortie */}
                        {showAutorisationForm === employeeId && (
                          <div className={`mt-4 p-4 rounded-xl ${bg('bg-slate-700', 'bg-gray-100')} space-y-4`}>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className={`text-xs font-medium ${text('text-gray-400', 'text-gray-600')} mb-1 block`}>
                                  Heure début
                                </label>
                                <input
                                  type="time"
                                  value={autorisationData.heureDebut}
                                  onChange={e => setAutorisationData(prev => ({ ...prev, heureDebut: e.target.value }))}
                                  className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-600 text-white', 'bg-white text-gray-900')} focus:outline-none focus:ring-2 focus:ring-orange-500`}
                                />
                              </div>
                              <div>
                                <label className={`text-xs font-medium ${text('text-gray-400', 'text-gray-600')} mb-1 block`}>
                                  Heure fin
                                </label>
                                <input
                                  type="time"
                                  value={autorisationData.heureFin}
                                  onChange={e => setAutorisationData(prev => ({ ...prev, heureFin: e.target.value }))}
                                  className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-600 text-white', 'bg-white text-gray-900')} focus:outline-none focus:ring-2 focus:ring-orange-500`}
                                />
                              </div>
                            </div>

                            {/* Durée calculée */}
                            {autorisationData.heureDebut && autorisationData.heureFin && (
                              <div className={`text-center py-2 px-4 rounded-lg ${bg('bg-orange-500/20', 'bg-orange-100')}`}>
                                <span className="text-orange-500 font-semibold">
                                  Durée: {(() => {
                                    const [hD, mD] = autorisationData.heureDebut.split(':').map(Number);
                                    const [hF, mF] = autorisationData.heureFin.split(':').map(Number);
                                    const mins = (hF * 60 + mF) - (hD * 60 + mD);
                                    if (mins <= 0) return 'Invalide';
                                    const h = Math.floor(mins / 60);
                                    const m = mins % 60;
                                    return `${h}h${m > 0 ? m.toString().padStart(2, '0') : ''}`;
                                  })()}
                                </span>
                              </div>
                            )}

                            <div>
                              <label className={`text-xs font-medium ${text('text-gray-400', 'text-gray-600')} mb-1 block`}>
                                Motif (optionnel)
                              </label>
                              <input
                                type="text"
                                value={autorisationData.motif}
                                onChange={e => setAutorisationData(prev => ({ ...prev, motif: e.target.value }))}
                                placeholder="Ex: RDV médical"
                                className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-600 text-white placeholder-gray-400', 'bg-white text-gray-900 placeholder-gray-400')} focus:outline-none focus:ring-2 focus:ring-orange-500`}
                              />
                            </div>

                            {/* Zone signature autorisation */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <label className={`text-xs font-medium ${text('text-gray-400', 'text-gray-600')} flex items-center gap-2`}>
                                  <PenTool size={14} />
                                  Signature du salarié
                                </label>
                                <button
                                  onClick={() => {
                                    setAutorisationSignature(null);
                                    const canvas = autorisationCanvasRef.current;
                                    const ctx = canvas?.getContext('2d');
                                    if (ctx && canvas) {
                                      const rect = canvas.getBoundingClientRect();
                                      ctx.clearRect(0, 0, rect.width, rect.height);
                                    }
                                  }}
                                  className={`p-1.5 rounded-lg ${bg('bg-slate-600 hover:bg-slate-500', 'bg-gray-200 hover:bg-gray-300')}`}
                                >
                                  <Trash2 size={14} className={text('text-gray-400', 'text-gray-500')} />
                                </button>
                              </div>
                              <div className={`relative rounded-xl overflow-hidden ${bg('bg-slate-600', 'bg-white')} border-2 border-dashed ${autorisationSignature ? 'border-orange-500' : bg('border-slate-500', 'border-gray-300')}`}>
                                <canvas
                                  ref={autorisationCanvasRef}
                                  className="w-full h-28 touch-none cursor-crosshair"
                                  onMouseDown={(e) => {
                                    const canvas = autorisationCanvasRef.current;
                                    const ctx = canvas?.getContext('2d');
                                    if (!ctx || !canvas) return;
                                    const rect = canvas.getBoundingClientRect();
                                    if (canvas.width !== rect.width * 2) {
                                      canvas.width = rect.width * 2;
                                      canvas.height = rect.height * 2;
                                      ctx.scale(2, 2);
                                      ctx.lineCap = 'round';
                                      ctx.lineJoin = 'round';
                                      ctx.lineWidth = 2;
                                      ctx.strokeStyle = '#f97316';
                                    }
                                    setIsDrawing(true);
                                    const x = e.clientX - rect.left;
                                    const y = e.clientY - rect.top;
                                    ctx.beginPath();
                                    ctx.moveTo(x, y);
                                  }}
                                  onMouseMove={(e) => {
                                    if (!isDrawing) return;
                                    const canvas = autorisationCanvasRef.current;
                                    const ctx = canvas?.getContext('2d');
                                    if (!ctx) return;
                                    const rect = canvas.getBoundingClientRect();
                                    const x = e.clientX - rect.left;
                                    const y = e.clientY - rect.top;
                                    ctx.lineTo(x, y);
                                    ctx.stroke();
                                  }}
                                  onMouseUp={() => {
                                    setIsDrawing(false);
                                    const canvas = autorisationCanvasRef.current;
                                    if (canvas) setAutorisationSignature(canvas.toDataURL('image/png'));
                                  }}
                                  onMouseLeave={() => {
                                    if (isDrawing) {
                                      setIsDrawing(false);
                                      const canvas = autorisationCanvasRef.current;
                                      if (canvas) setAutorisationSignature(canvas.toDataURL('image/png'));
                                    }
                                  }}
                                  onTouchStart={(e) => {
                                    e.preventDefault();
                                    const canvas = autorisationCanvasRef.current;
                                    const ctx = canvas?.getContext('2d');
                                    if (!ctx || !canvas) return;
                                    const rect = canvas.getBoundingClientRect();
                                    if (canvas.width !== rect.width * 2) {
                                      canvas.width = rect.width * 2;
                                      canvas.height = rect.height * 2;
                                      ctx.scale(2, 2);
                                      ctx.lineCap = 'round';
                                      ctx.lineJoin = 'round';
                                      ctx.lineWidth = 2;
                                      ctx.strokeStyle = '#f97316';
                                    }
                                    setIsDrawing(true);
                                    const x = e.touches[0].clientX - rect.left;
                                    const y = e.touches[0].clientY - rect.top;
                                    ctx.beginPath();
                                    ctx.moveTo(x, y);
                                  }}
                                  onTouchMove={(e) => {
                                    e.preventDefault();
                                    if (!isDrawing) return;
                                    const canvas = autorisationCanvasRef.current;
                                    const ctx = canvas?.getContext('2d');
                                    if (!ctx) return;
                                    const rect = canvas.getBoundingClientRect();
                                    const x = e.touches[0].clientX - rect.left;
                                    const y = e.touches[0].clientY - rect.top;
                                    ctx.lineTo(x, y);
                                    ctx.stroke();
                                  }}
                                  onTouchEnd={() => {
                                    setIsDrawing(false);
                                    const canvas = autorisationCanvasRef.current;
                                    if (canvas) setAutorisationSignature(canvas.toDataURL('image/png'));
                                  }}
                                />
                                {!autorisationSignature && (
                                  <div className={`absolute inset-0 flex items-center justify-center pointer-events-none ${text('text-gray-500', 'text-gray-400')}`}>
                                    <span className="text-xs">Signez ici</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Bouton valider autorisation */}
                            <button
                              onClick={async () => {
                                if (!autorisationData.heureDebut || !autorisationData.heureFin) {
                                  setSaveError('Veuillez renseigner les heures');
                                  return;
                                }
                                if (!autorisationSignature) {
                                  setSaveError('Veuillez signer l\'autorisation');
                                  return;
                                }

                                setSavingAutorisation(true);
                                try {
                                  // Sauvegarder l'autorisation
                                  const res = await fetch(`${API_URL}/pointage/autorisation-sortie`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      employeeId,
                                      date: formatDateISO(selectedDate),
                                      heureDebut: autorisationData.heureDebut,
                                      heureFin: autorisationData.heureFin,
                                      motif: autorisationData.motif,
                                      signature: autorisationSignature
                                    })
                                  });

                                  if (res.ok) {
                                    const data = await res.json();

                                    // Générer le PDF
                                    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'A4' });
                                    const pageWidth = doc.internal.pageSize.getWidth();

                                    // Titre
                                    doc.setFontSize(20);
                                    doc.setTextColor(249, 115, 22); // Orange
                                    doc.setFont('helvetica', 'bold');
                                    doc.text('AUTORISATION DE SORTIE', pageWidth / 2, 30, { align: 'center' });

                                    // Cadre infos
                                    doc.setDrawColor(200, 200, 200);
                                    doc.setFillColor(250, 250, 250);
                                    doc.roundedRect(20, 45, pageWidth - 40, 60, 3, 3, 'FD');

                                    doc.setFontSize(12);
                                    doc.setTextColor(60, 60, 60);
                                    doc.setFont('helvetica', 'normal');

                                    doc.text(`Salarié : ${ep.employee.prenom} ${ep.employee.nom}`, 30, 58);
                                    doc.text(`Poste : ${ep.employee.poste || 'Agent'}`, 30, 68);
                                    doc.text(`Date : ${formatDate(selectedDate)}`, 30, 78);
                                    doc.text(`Heure de sortie : ${autorisationData.heureDebut}`, 30, 88);
                                    doc.text(`Heure de retour : ${autorisationData.heureFin}`, 30, 98);

                                    // Durée
                                    const [hD, mD] = autorisationData.heureDebut.split(':').map(Number);
                                    const [hF, mF] = autorisationData.heureFin.split(':').map(Number);
                                    const mins = (hF * 60 + mF) - (hD * 60 + mD);
                                    const h = Math.floor(mins / 60);
                                    const m = mins % 60;
                                    const dureeStr = `${h}h${m > 0 ? m.toString().padStart(2, '0') : ''}`;

                                    doc.setFont('helvetica', 'bold');
                                    doc.setTextColor(249, 115, 22);
                                    doc.text(`Durée d'absence : ${dureeStr}`, pageWidth / 2, 115, { align: 'center' });

                                    // Motif
                                    if (autorisationData.motif) {
                                      doc.setFont('helvetica', 'normal');
                                      doc.setTextColor(60, 60, 60);
                                      doc.text(`Motif : ${autorisationData.motif}`, 30, 130);
                                    }

                                    // Signature
                                    doc.setFontSize(11);
                                    doc.setTextColor(100, 100, 100);
                                    doc.text('Signature du salarié :', 30, 155);

                                    if (autorisationSignature) {
                                      try {
                                        doc.addImage(autorisationSignature, 'PNG', 30, 160, 60, 30);
                                      } catch (e) {
                                        console.error('Erreur signature PDF:', e);
                                      }
                                    }

                                    // Pied de page
                                    doc.setFontSize(8);
                                    doc.setTextColor(150, 150, 150);
                                    doc.text(`Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, pageWidth / 2, 280, { align: 'center' });
                                    doc.text('France Recycling - Insertion', pageWidth / 2, 286, { align: 'center' });

                                    // Télécharger le PDF
                                    doc.save(`Autorisation_Sortie_${ep.employee.nom}_${formatDateISO(selectedDate)}.pdf`);

                                    // Reset
                                    setAutorisationData({ heureDebut: '', heureFin: '', motif: '' });
                                    setAutorisationSignature(null);
                                    setShowAutorisationForm(null);
                                    setSaveSuccess(employeeId);
                                    setTimeout(() => setSaveSuccess(null), 3000);

                                    // Recharger les données
                                    loadData();
                                  } else {
                                    const err = await res.json();
                                    setSaveError(err.error || 'Erreur lors de la sauvegarde');
                                  }
                                } catch (error: any) {
                                  setSaveError(error.message || 'Erreur réseau');
                                } finally {
                                  setSavingAutorisation(false);
                                }
                              }}
                              disabled={savingAutorisation || !autorisationData.heureDebut || !autorisationData.heureFin || !autorisationSignature}
                              className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                                autorisationSignature && autorisationData.heureDebut && autorisationData.heureFin
                                  ? 'bg-orange-500 hover:bg-orange-600 text-white'
                                  : bg('bg-slate-600 text-gray-500', 'bg-gray-200 text-gray-400')
                              }`}
                            >
                              {savingAutorisation ? (
                                <Loader2 size={20} className="animate-spin" />
                              ) : (
                                <>
                                  <FileText size={20} />
                                  Valider et générer PDF
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Bouton fermer */}
                    <button
                      onClick={() => {
                        setActiveSheet(null);
                        setShowAutorisationForm(null);
                      }}
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
                    onClick={async () => {
                      const sig = signatures[activeSheet];
                      if (!sig) {
                        setSaveError('Veuillez signer avant de valider');
                        return;
                      }
                      const success = await signerPeriode(employeeId, periode as 'matin' | 'apresmidi', sig);
                      // Fermer le panneau SEULEMENT si la signature a réussi
                      if (success) {
                        setTimeout(() => setActiveSheet(null), 1000);
                      }
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
