import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import {
  Users, UserPlus, FileText, Calendar, AlertTriangle, CheckCircle, Clock,
  Building2, GraduationCap, Briefcase, FileCheck, Upload, Download,
  ChevronRight, ChevronDown, Search, Filter, Plus, Edit, Trash2, Eye,
  Phone, Mail, MapPin, User, FileWarning, TrendingUp, TrendingDown,
  ClipboardList, Target, Award, AlertCircle, Bell, X, Save, Printer,
  BarChart3, PieChart, ArrowUpRight, ArrowDownRight, RefreshCw,
  FolderOpen, Folder, ChevronLeft, MoreVertical, Settings, LogOut,
  Home, Menu, Car, Heart, Baby, Globe, Monitor, Euro, CreditCard,
  Building, Landmark, Shield, IdCard, FileSignature, CalendarDays,
  UserCheck, UserX, Banknote, Receipt, Scale, Gavel, BadgeCheck,
  FileDown
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_URL = 'https://valotik-api-546691893264.europe-west1.run.app/api/insertion';
const AUTH_API = 'https://valotik-api-546691893264.europe-west1.run.app/api/auth';

// Gestion de l'authentification
const getAuthToken = (): string | null => localStorage.getItem('rh_auth_token');
const setAuthToken = (token: string) => localStorage.setItem('rh_auth_token', token);
const removeAuthToken = () => localStorage.removeItem('rh_auth_token');
const getAuthUser = (): { username: string; role: string } | null => {
  const user = localStorage.getItem('rh_auth_user');
  return user ? JSON.parse(user) : null;
};
const setAuthUser = (user: { username: string; role: string }) =>
  localStorage.setItem('rh_auth_user', JSON.stringify(user));
const removeAuthUser = () => localStorage.removeItem('rh_auth_user');

// Fonction fetch avec authentification
const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getAuthToken();
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(url, { ...options, headers });
};

// Types complets
interface InsertionEmployee {
  id: string;
  civilite: string;
  nom: string;
  prenom: string;
  nomUsage?: string;
  dateNaissance: string;
  lieuNaissance?: string;
  nationalite: string;
  numeroSecu?: string;
  adresse: string;
  codePostal: string;
  ville: string;
  telephone: string;
  telephoneSecondaire?: string;
  email?: string;
  situationFamiliale?: string;
  nombreEnfants: number;
  permisConduire: boolean;
  typePermis?: string;
  vehicule: boolean;
  typePieceIdentite?: string;
  numeroPieceIdentite?: string;
  dateExpirationPiece?: string;
  inscritFranceTravail: boolean;
  numeroFranceTravail?: string;
  beneficiaireRSA: boolean;
  beneficiaireASS: boolean;
  beneficiaireAAH: boolean;
  reconnaissanceTH: boolean;
  passInclusionNumero?: string;
  passInclusionDate?: string;
  passInclusionExpiration?: string;
  eligibiliteIAE?: string;
  dateEntree: string;
  dateSortie?: string;
  typeContrat: string;
  dureeHebdo: number;
  poste?: string;
  salaireBrut?: number;
  statut: string;
  motifSortie?: string;
  typeSortie?: string;
  photoUrl?: string;
  notes?: string;
  createdAt: string;
  fichePro?: any;
  suivis?: any[];
  conventionsPMSMP?: any[];
  documents?: any[];
  contrats?: any[];
  avertissements?: any[];
  formations?: any[];
  stats?: { documentsManquants: number; documentsExpires: number; dossierComplet: boolean };
  _count?: { suivis: number; conventionsPMSMP: number; formations: number; avertissements: number };
}

// Theme Context pour éviter les re-renders des composants
const ThemeContext = createContext<{ darkMode: boolean }>({ darkMode: true });

// Composant Input déplacé hors du composant principal pour éviter la perte de focus
const Input = ({ label, name, type = 'text', value, onChange, required = false, disabled = false, options, placeholder, className = '' }: any) => {
  const { darkMode } = useContext(ThemeContext);
  const bg = (dark: string, light: string) => darkMode ? dark : light;
  const text = (dark: string, light: string) => darkMode ? dark : light;

  return (
    <div className={className}>
      <label className={`block text-xs font-medium mb-1 ${text('text-slate-400', 'text-gray-600')}`}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {type === 'select' ? (
        <select
          name={name}
          value={value || ''}
          onChange={onChange}
          disabled={disabled}
          className={`w-full px-3 py-2 rounded-lg text-sm ${bg('bg-slate-700 text-white border-slate-600', 'bg-white text-gray-900 border-gray-300')} border focus:ring-2 focus:ring-blue-500 disabled:opacity-50`}
        >
          <option value="">{placeholder || 'Sélectionner...'}</option>
          {options?.map((opt: any) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          name={name}
          value={value || ''}
          onChange={onChange}
          disabled={disabled}
          rows={3}
          placeholder={placeholder}
          className={`w-full px-3 py-2 rounded-lg text-sm ${bg('bg-slate-700 text-white border-slate-600', 'bg-white text-gray-900 border-gray-300')} border focus:ring-2 focus:ring-blue-500 disabled:opacity-50`}
        />
      ) : type === 'checkbox' ? (
        <input
          type="checkbox"
          name={name}
          checked={value || false}
          onChange={onChange}
          disabled={disabled}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value || ''}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full px-3 py-2 rounded-lg text-sm ${bg('bg-slate-700 text-white border-slate-600', 'bg-white text-gray-900 border-gray-300')} border focus:ring-2 focus:ring-blue-500 disabled:opacity-50`}
        />
      )}
    </div>
  );
};

// Composant Section déplacé hors du composant principal pour éviter les re-renders
const Section = ({ title, icon: Icon, children, action }: any) => {
  const { darkMode } = useContext(ThemeContext);
  const bg = (dark: string, light: string) => darkMode ? dark : light;
  const text = (dark: string, light: string) => darkMode ? dark : light;

  return (
    <div className={`${bg('bg-slate-800', 'bg-white')} rounded-xl border ${bg('border-slate-700', 'border-gray-200')} overflow-hidden`}>
      <div className={`px-4 py-3 border-b ${bg('border-slate-700', 'border-gray-200')} flex items-center justify-between`}>
        <h3 className={`font-semibold flex items-center gap-2 ${text('text-white', 'text-gray-900')}`}>
          {Icon && <Icon className="w-5 h-5 text-blue-500" />}
          {title}
        </h3>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
};

export default function RHInsertionApp() {
  // Auth states
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authUser, setAuthUserState] = useState<{ username: string; role: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginError, setLoginError] = useState<string>('');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);

  const [darkMode, setDarkMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState<'dashboard' | 'liste' | 'fiche' | 'pointages' | 'agenda' | 'reglages' | 'organisme'>('dashboard');
  const [employees, setEmployees] = useState<InsertionEmployee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<InsertionEmployee | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [alertes, setAlertes] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'info' | 'pro' | 'admin' | 'rh'>('info');

  // Modals
  const [showNewEmployeeModal, setShowNewEmployeeModal] = useState(false);
  const [showSuiviModal, setShowSuiviModal] = useState(false);
  const [showPMSMPModal, setShowPMSMPModal] = useState(false);
  const [showFormationModal, setShowFormationModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showContratModal, setShowContratModal] = useState(false);
  const [showAvertissementModal, setShowAvertissementModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(false);

  // Form states
  const [formData, setFormData] = useState<any>({});
  const [suiviForm, setSuiviForm] = useState<any>({});
  const [pmsmpForm, setPmsmpForm] = useState<any>({});
  const [formationForm, setFormationForm] = useState<any>({});
  const [documentForm, setDocumentForm] = useState<any>({});
  const [contratForm, setContratForm] = useState<any>({});
  const [avertissementForm, setAvertissementForm] = useState<any>({});
  const [ficheProForm, setFicheProForm] = useState<any>({});

  // Pointages states
  const [pointagesMois, setPointagesMois] = useState<number>(new Date().getMonth() + 1);
  const [pointagesAnnee, setPointagesAnnee] = useState<number>(new Date().getFullYear());
  const [pointagesData, setPointagesData] = useState<any>(null);
  const [pointagesLoading, setPointagesLoading] = useState(false);
  const [editingPointage, setEditingPointage] = useState<string | null>(null);
  const [pointageValues, setPointageValues] = useState<Record<string, Record<string, number>>>({});
  const [selectedWeek, setSelectedWeek] = useState<number>(1);

  // Agenda states
  const [agendaMois, setAgendaMois] = useState<number>(new Date().getMonth() + 1);
  const [agendaAnnee, setAgendaAnnee] = useState<number>(new Date().getFullYear());
  const [agendaEvents, setAgendaEvents] = useState<any[]>([]);
  const [agendaLoading, setAgendaLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [agendaView, setAgendaView] = useState<'month' | 'week'>('month');

  // Parcours states
  const [parcoursData, setParcoursData] = useState<any>(null);
  const [parcoursLoading, setParcoursLoading] = useState(false);
  const [selectedParcoursEvent, setSelectedParcoursEvent] = useState<any>(null);

  // Objectifs states
  const [objectifConfig, setObjectifConfig] = useState<any>(null);
  const [objectifsIndividuels, setObjectifsIndividuels] = useState<any[]>([]);
  const [showObjectifModal, setShowObjectifModal] = useState(false);
  const [objectifForm, setObjectifForm] = useState<any>({});
  const [editingObjectifId, setEditingObjectifId] = useState<string | null>(null);

  // Organisme states
  const [organismeData, setOrganismeData] = useState<any>(null);
  const [organismeLoading, setOrganismeLoading] = useState(false);
  const [organismeTab, setOrganismeTab] = useState<'info' | 'convention' | 'effectifs' | 'ateliers' | 'financement' | 'comptable' | 'objectifs' | 'banque'>('info');
  const [organismeForm, setOrganismeForm] = useState<any>({});
  const [conventionForm, setConventionForm] = useState<any>({});
  const [atelierForm, setAtelierForm] = useState<any>({});
  const [objectifsNegociesForm, setObjectifsNegociesForm] = useState<any>({});
  const [suiviObjectifForm, setSuiviObjectifForm] = useState<any>({});
  const [dashboardObjectifs, setDashboardObjectifs] = useState<any>(null);
  const [showAtelierModal, setShowAtelierModal] = useState(false);
  const [showSuiviObjectifModal, setShowSuiviObjectifModal] = useState(false);
  const [editingAtelierId, setEditingAtelierId] = useState<string | null>(null);

  const bg = (dark: string, light: string) => darkMode ? dark : light;
  const text = (dark: string, light: string) => darkMode ? dark : light;

  // Handler stable pour les changements de formulaire (évite la perte de focus)
  const handleFormDataChange = useCallback((e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }, []);

  // Vérification de l'authentification au démarrage
  useEffect(() => {
    const checkAuth = async () => {
      const token = getAuthToken();
      if (!token) {
        setAuthLoading(false);
        return;
      }
      try {
        const res = await fetch(`${AUTH_API}/verify`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAuthUserState(data.data.user);
          setIsAuthenticated(true);
        } else {
          removeAuthToken();
          removeAuthUser();
        }
      } catch {
        removeAuthToken();
        removeAuthUser();
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Fonction de connexion
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await fetch(`${AUTH_API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAuthToken(data.data.token);
        setAuthUser(data.data.user);
        setAuthUserState(data.data.user);
        setIsAuthenticated(true);
        setLoginForm({ username: '', password: '' });
      } else {
        setLoginError(data.message || 'Identifiants incorrects');
      }
    } catch {
      setLoginError('Erreur de connexion au serveur');
    } finally {
      setLoginLoading(false);
    }
  };

  // Fonction de déconnexion
  const handleLogout = () => {
    removeAuthToken();
    removeAuthUser();
    setIsAuthenticated(false);
    setAuthUserState(null);
    setEmployees([]);
    setStats(null);
    setAlertes(null);
  };

  // Chargement des données
  const loadData = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const [employeesRes, statsRes, alertesRes] = await Promise.all([
        authFetch(`${API_URL}/employees`),
        authFetch(`${API_URL}/stats`),
        authFetch(`${API_URL}/alertes`)
      ]);
      if (employeesRes.ok) {
        const data = await employeesRes.json();
        setEmployees(data.data?.employees || []);
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.data);
      }
      if (alertesRes.ok) {
        const data = await alertesRes.json();
        setAlertes(data.data);
      }
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { if (isAuthenticated) loadData(); }, [isAuthenticated, loadData]);

  const loadEmployeeDetails = async (id: string) => {
    try {
      const res = await authFetch(`${API_URL}/employees/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedEmployee(data.data);
        setFormData(data.data);
        setFicheProForm(data.data.fichePro || {});
        setActiveView('fiche');
        setEditingEmployee(false);
        // Reset parcours when switching employee
        setParcoursData(null);
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  // PARCOURS VISUEL
  const loadParcours = useCallback(async (employeeId: string) => {
    setParcoursLoading(true);
    try {
      const res = await authFetch(`${API_URL}/employees/${employeeId}/parcours`);
      if (res.ok) {
        const data = await res.json();
        setParcoursData(data.data);
      }
    } catch (error) {
      console.error('Erreur chargement parcours:', error);
    } finally {
      setParcoursLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'parcours' && selectedEmployee?.id && !parcoursData) {
      loadParcours(selectedEmployee.id);
    }
  }, [activeTab, selectedEmployee?.id, parcoursData, loadParcours]);

  // OBJECTIFS
  const OBJECTIF_API = 'https://valotik-api-546691893264.europe-west1.run.app/api/objectifs';

  const loadObjectifConfig = useCallback(async () => {
    try {
      const res = await authFetch(`${OBJECTIF_API}/configuration`);
      if (res.ok) {
        const data = await res.json();
        setObjectifConfig(data.data);
      }
    } catch (error) {
      console.error('Erreur chargement config:', error);
    }
  }, []);

  const saveObjectifConfig = async () => {
    if (!objectifConfig?.id) return;
    setSaving(true);
    try {
      const res = await authFetch(`${OBJECTIF_API}/configuration/${objectifConfig.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(objectifConfig)
      });
      if (res.ok) {
        const data = await res.json();
        setObjectifConfig(data.data);
        // Recharger le parcours pour recalculer la progression
        if (selectedEmployee?.id) {
          setParcoursData(null);
        }
      }
    } catch (error) {
      console.error('Erreur sauvegarde config:', error);
    } finally {
      setSaving(false);
    }
  };

  const loadObjectifsIndividuels = useCallback(async (employeeId: string) => {
    try {
      const res = await authFetch(`${OBJECTIF_API}/employees/${employeeId}/objectifs`);
      if (res.ok) {
        const data = await res.json();
        setObjectifsIndividuels(data.data.objectifs || []);
      }
    } catch (error) {
      console.error('Erreur chargement objectifs:', error);
    }
  }, []);

  const saveObjectifIndividuel = async () => {
    if (!selectedEmployee) return;
    setSaving(true);
    try {
      const url = editingObjectifId
        ? `${OBJECTIF_API}/objectifs/${editingObjectifId}`
        : `${OBJECTIF_API}/employees/${selectedEmployee.id}/objectifs`;
      const method = editingObjectifId ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(objectifForm)
      });
      if (res.ok) {
        setShowObjectifModal(false);
        setObjectifForm({});
        setEditingObjectifId(null);
        loadObjectifsIndividuels(selectedEmployee.id);
        setParcoursData(null); // Recharger le parcours
      }
    } catch (error) {
      console.error('Erreur sauvegarde objectif:', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteObjectifIndividuel = async (id: string) => {
    if (!confirm('Supprimer cet objectif ?')) return;
    try {
      await authFetch(`${OBJECTIF_API}/objectifs/${id}`, { method: 'DELETE' });
      if (selectedEmployee) {
        loadObjectifsIndividuels(selectedEmployee.id);
        setParcoursData(null);
      }
    } catch (error) {
      console.error('Erreur suppression objectif:', error);
    }
  };

  // ORGANISME
  const ORGANISME_API = 'https://valotik-api-546691893264.europe-west1.run.app/api/organisme';

  const loadOrganisme = useCallback(async () => {
    setOrganismeLoading(true);
    try {
      const res = await authFetch(ORGANISME_API);
      if (res.ok) {
        const data = await res.json();
        setOrganismeData(data.data);
        if (data.data) {
          setOrganismeForm(data.data);
        }
      }
    } catch (error) {
      console.error('Erreur chargement organisme:', error);
    } finally {
      setOrganismeLoading(false);
    }
  }, []);

  const loadDashboardObjectifs = useCallback(async () => {
    try {
      const res = await authFetch(`${ORGANISME_API}/dashboard/objectifs`);
      if (res.ok) {
        const data = await res.json();
        setDashboardObjectifs(data.data);
      }
    } catch (error) {
      console.error('Erreur chargement dashboard objectifs:', error);
    }
  }, []);

  const saveOrganisme = async () => {
    setSaving(true);
    try {
      const res = await authFetch(ORGANISME_API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(organismeForm)
      });
      if (res.ok) {
        const data = await res.json();
        setOrganismeData(data.data);
        setOrganismeForm(data.data);
      }
    } catch (error) {
      console.error('Erreur sauvegarde organisme:', error);
    } finally {
      setSaving(false);
    }
  };

  const saveConvention = async () => {
    if (!organismeData?.id) return;
    setSaving(true);
    try {
      const url = conventionForm.id
        ? `${ORGANISME_API}/conventions/${conventionForm.id}`
        : `${ORGANISME_API}/conventions`;
      const method = conventionForm.id ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...conventionForm, organismeId: organismeData.id })
      });
      if (res.ok) {
        loadOrganisme();
        loadDashboardObjectifs();
      }
    } catch (error) {
      console.error('Erreur sauvegarde convention:', error);
    } finally {
      setSaving(false);
    }
  };

  const saveObjectifsNegocies = async () => {
    if (!organismeData?.conventions?.[0]?.id) return;
    setSaving(true);
    try {
      const conventionId = organismeData.conventions[0].id;
      const res = await authFetch(`${ORGANISME_API}/conventions/${conventionId}/objectifs`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(objectifsNegociesForm)
      });
      if (res.ok) {
        loadOrganisme();
        loadDashboardObjectifs();
      }
    } catch (error) {
      console.error('Erreur sauvegarde objectifs:', error);
    } finally {
      setSaving(false);
    }
  };

  const saveSuiviObjectif = async () => {
    const objectifNegocie = organismeData?.conventions?.[0]?.objectifsNegocies?.[0];
    if (!objectifNegocie?.id) return;
    setSaving(true);
    try {
      const res = await authFetch(`${ORGANISME_API}/objectifs/${objectifNegocie.id}/suivis`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(suiviObjectifForm)
      });
      if (res.ok) {
        setShowSuiviObjectifModal(false);
        setSuiviObjectifForm({});
        loadOrganisme();
        loadDashboardObjectifs();
      }
    } catch (error) {
      console.error('Erreur sauvegarde suivi:', error);
    } finally {
      setSaving(false);
    }
  };

  const saveAtelier = async () => {
    if (!organismeData?.id) return;
    setSaving(true);
    try {
      const url = editingAtelierId
        ? `${ORGANISME_API}/ateliers/${editingAtelierId}`
        : `${ORGANISME_API}/ateliers`;
      const method = editingAtelierId ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...atelierForm, organismeId: organismeData.id })
      });
      if (res.ok) {
        setShowAtelierModal(false);
        setAtelierForm({});
        setEditingAtelierId(null);
        loadOrganisme();
      }
    } catch (error) {
      console.error('Erreur sauvegarde atelier:', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteAtelier = async (id: string) => {
    if (!confirm('Supprimer cet atelier ?')) return;
    try {
      await authFetch(`${ORGANISME_API}/ateliers/${id}`, { method: 'DELETE' });
      loadOrganisme();
    } catch (error) {
      console.error('Erreur suppression atelier:', error);
    }
  };

  useEffect(() => {
    if (activeView === 'organisme' && !organismeData) {
      loadOrganisme();
      loadDashboardObjectifs();
    }
    // Charger les réglages quand on ouvre l'onglet Réglages dans Organisme
    if (activeView === 'organisme' && organismeTab === 'reglages' && !objectifConfig) {
      loadObjectifConfig();
    }
    // Charger aussi les objectifs pour le widget du dashboard
    if (activeView === 'dashboard' && !dashboardObjectifs) {
      loadDashboardObjectifs();
    }
  }, [activeView, organismeData, organismeTab, objectifConfig, dashboardObjectifs, loadOrganisme, loadDashboardObjectifs, loadObjectifConfig]);

  useEffect(() => {
    if (activeView === 'reglages' && !objectifConfig) {
      loadObjectifConfig();
    }
  }, [activeView, objectifConfig, loadObjectifConfig]);

  useEffect(() => {
    if (activeTab === 'parcours' && selectedEmployee?.id) {
      loadObjectifsIndividuels(selectedEmployee.id);
    }
  }, [activeTab, selectedEmployee?.id, loadObjectifsIndividuels]);

  // POINTAGES
  const POINTAGE_API = 'https://valotik-api-546691893264.europe-west1.run.app/api/pointage';

  const loadPointages = useCallback(async () => {
    setPointagesLoading(true);
    try {
      const res = await authFetch(`${POINTAGE_API}/mensuel?mois=${pointagesMois}&annee=${pointagesAnnee}`);
      if (res.ok) {
        const data = await res.json();
        setPointagesData(data.data);
        // Initialiser les valeurs de pointage avec les données réelles uniquement
        const values: Record<string, Record<string, number>> = {};
        data.data.pointages.forEach((p: any) => {
          values[p.employee.id] = {};
          p.pointage.journees?.forEach((j: any) => {
            const dateStr = new Date(j.date).toISOString().split('T')[0];
            values[p.employee.id][dateStr] = j.heuresTravaillees;
          });
        });
        setPointageValues(values);
      }
    } catch (error) {
      console.error('Erreur pointages:', error);
    } finally {
      setPointagesLoading(false);
    }
  }, [pointagesMois, pointagesAnnee]);

  useEffect(() => {
    if (activeView === 'pointages') {
      loadPointages();
    }
  }, [activeView, loadPointages]);

  const savePointageValue = async (employeeId: string, pointageMensuelId: string, date: string, heures: number) => {
    try {
      await authFetch(`${POINTAGE_API}/journalier/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pointageMensuelId,
          pointages: [{ date, heures }]
        })
      });
      // Ne pas recharger les données pour éviter de perdre le focus
    } catch (error) {
      console.error('Erreur save pointage:', error);
    }
  };

  const utiliserBanqueHeures = async (pointageMensuelId: string, heures: number) => {
    try {
      await authFetch(`${POINTAGE_API}/banque/utiliser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pointageMensuelId, heuresAUtiliser: heures })
      });
      loadPointages();
    } catch (error) {
      console.error('Erreur banque:', error);
    }
  };

  const validerPointageIndividuel = async (pointageMensuelId: string, employeeName: string, excedent: number) => {
    const message = excedent > 0
      ? `Valider le pointage de ${employeeName} ? ${Math.round(excedent * 10) / 10}h seront transférées vers sa banque d'heures.`
      : `Valider le pointage de ${employeeName} ?`;
    if (!confirm(message)) return;
    try {
      await authFetch(`${POINTAGE_API}/banque/transferer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pointageMensuelId })
      });
      loadPointages();
    } catch (error) {
      console.error('Erreur validation:', error);
    }
  };

  // AGENDA
  const loadAgenda = useCallback(async () => {
    setAgendaLoading(true);
    try {
      const res = await authFetch(`${API_URL}/agenda?mois=${agendaMois}&annee=${agendaAnnee}`);
      if (res.ok) {
        const data = await res.json();
        setAgendaEvents(data.data.events || []);
      }
    } catch (error) {
      console.error('Erreur agenda:', error);
    } finally {
      setAgendaLoading(false);
    }
  }, [agendaMois, agendaAnnee]);

  useEffect(() => {
    if (activeView === 'agenda') {
      loadAgenda();
    }
  }, [activeView, loadAgenda]);

  // CRUD Employee
  const saveEmployee = async () => {
    setSaving(true);
    try {
      const url = selectedEmployee ? `${API_URL}/employees/${selectedEmployee.id}` : `${API_URL}/employees`;
      const method = selectedEmployee ? 'PUT' : 'POST';
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const data = await res.json();
        if (selectedEmployee) {
          setSelectedEmployee(data.data);
        }
        setEditingEmployee(false);
        setShowNewEmployeeModal(false);
        loadData();
      }
    } catch (error) {
      console.error('Erreur save:', error);
    } finally {
      setSaving(false);
    }
  };

  // CRUD Fiche PRO
  const saveFichePro = async () => {
    if (!selectedEmployee) return;
    setSaving(true);
    try {
      const res = await authFetch(`${API_URL}/employees/${selectedEmployee.id}/fiche-pro`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ficheProForm)
      });
      if (res.ok) {
        loadEmployeeDetails(selectedEmployee.id);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setSaving(false);
    }
  };

  // CRUD Suivi
  const saveSuivi = async () => {
    if (!selectedEmployee) return;
    setSaving(true);
    try {
      const res = await authFetch(`${API_URL}/employees/${selectedEmployee.id}/suivis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(suiviForm)
      });
      if (res.ok) {
        setShowSuiviModal(false);
        setSuiviForm({});
        loadEmployeeDetails(selectedEmployee.id);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteSuivi = async (id: string) => {
    if (!confirm('Supprimer cet entretien ?')) return;
    try {
      await authFetch(`${API_URL}/suivis/${id}`, { method: 'DELETE' });
      if (selectedEmployee) loadEmployeeDetails(selectedEmployee.id);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  // CRUD PMSMP
  const savePMSMP = async () => {
    if (!selectedEmployee) return;
    setSaving(true);
    try {
      const res = await authFetch(`${API_URL}/employees/${selectedEmployee.id}/pmsmp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pmsmpForm)
      });
      if (res.ok) {
        setShowPMSMPModal(false);
        setPmsmpForm({});
        loadEmployeeDetails(selectedEmployee.id);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setSaving(false);
    }
  };

  // CRUD Formation
  const saveFormation = async () => {
    if (!selectedEmployee) return;
    setSaving(true);
    try {
      const res = await authFetch(`${API_URL}/employees/${selectedEmployee.id}/formations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formationForm)
      });
      if (res.ok) {
        setShowFormationModal(false);
        setFormationForm({});
        loadEmployeeDetails(selectedEmployee.id);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setSaving(false);
    }
  };

  // CRUD Document
  const saveDocument = async () => {
    if (!selectedEmployee) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('typeDocument', documentForm.typeDocument || '');
      formData.append('nomDocument', documentForm.nomDocument || '');
      if (documentForm.dateExpiration) {
        formData.append('dateExpiration', documentForm.dateExpiration);
      }
      if (documentForm.file) {
        formData.append('file', documentForm.file);
      }

      const token = getAuthToken();
      const res = await fetch(`${API_URL}/employees/${selectedEmployee.id}/documents`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });
      if (res.ok) {
        setShowDocumentModal(false);
        setDocumentForm({});
        loadEmployeeDetails(selectedEmployee.id);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteDocument = async (id: string) => {
    if (!confirm('Supprimer ce document ?')) return;
    try {
      await authFetch(`${API_URL}/documents/${id}`, { method: 'DELETE' });
      if (selectedEmployee) loadEmployeeDetails(selectedEmployee.id);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  // CRUD Contrat
  const saveContrat = async () => {
    if (!selectedEmployee) return;
    setSaving(true);
    try {
      const res = await authFetch(`${API_URL}/employees/${selectedEmployee.id}/contrats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contratForm)
      });
      if (res.ok) {
        setShowContratModal(false);
        setContratForm({});
        loadEmployeeDetails(selectedEmployee.id);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setSaving(false);
    }
  };

  // CRUD Avertissement
  const saveAvertissement = async () => {
    if (!selectedEmployee) return;
    setSaving(true);
    try {
      const res = await authFetch(`${API_URL}/employees/${selectedEmployee.id}/avertissements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(avertissementForm)
      });
      if (res.ok) {
        setShowAvertissementModal(false);
        setAvertissementForm({});
        loadEmployeeDetails(selectedEmployee.id);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setSaving(false);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchSearch = searchTerm === '' ||
      `${emp.nom} ${emp.prenom}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatut = filterStatut === '' || emp.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  const formatDate = (date: string | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  // =================== GENERATION PDF PROFESSIONNELLE ===================

  // Générer une référence de document unique
  const generateDocReference = (type: string, employeeId?: string) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const seq = String(Math.floor(Math.random() * 9999)).padStart(4, '0');
    const empRef = employeeId ? `-${employeeId.substring(0, 6).toUpperCase()}` : '';
    return `${type}-${year}${month}${day}${empRef}-${seq}`;
  };

  // Helper pour en-tête professionnel ISO
  const addPDFHeaderPro = (doc: jsPDF, config: {
    title: string;
    docType: string; // FI=Fiche Individuelle, RS=Rapport Suivi, AE=Attestation Emploi, SE=Synthèse Effectifs
    docRef: string;
    version?: string;
    classification?: 'CONFIDENTIEL' | 'INTERNE' | 'PUBLIC';
    subtitle?: string;
  }) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const org = organismeData;
    const { title, docType, docRef, version = '1.0', classification = 'CONFIDENTIEL', subtitle } = config;

    // ===== BANDEAU SUPÉRIEUR =====
    doc.setFillColor(35, 41, 54);
    doc.rect(0, 0, pageWidth, 22, 'F');

    // Logo/Nom structure (gauche)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(org?.raisonSociale?.toUpperCase() || 'STRUCTURE IAE', 10, 8);

    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 180, 180);
    doc.text(org?.formeJuridique || 'Association', 10, 13);
    doc.text(`SIRET: ${org?.siret || 'N/A'}`, 10, 17);

    // Infos document (droite) - Style ISO
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.text('RÉFÉRENCE', pageWidth - 55, 6);
    doc.text('VERSION', pageWidth - 35, 6);
    doc.text('DATE', pageWidth - 18, 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(docRef, pageWidth - 55, 11);
    doc.text(version, pageWidth - 35, 11);
    doc.text(new Date().toLocaleDateString('fr-FR'), pageWidth - 18, 11);

    // Classification
    const classColors: Record<string, number[]> = {
      'CONFIDENTIEL': [220, 38, 38],
      'INTERNE': [245, 158, 11],
      'PUBLIC': [34, 197, 94]
    };
    doc.setFillColor(...(classColors[classification] || [100, 100, 100]) as [number, number, number]);
    doc.roundedRect(pageWidth - 55, 14, 45, 5, 1, 1, 'F');
    doc.setTextColor(255);
    doc.setFontSize(5);
    doc.setFont('helvetica', 'bold');
    doc.text(classification, pageWidth - 32.5, 17.5, { align: 'center' });

    // ===== TITRE DU DOCUMENT =====
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 22, pageWidth, 18, 'F');

    doc.setTextColor(35, 41, 54);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(title.toUpperCase(), pageWidth / 2, 30, { align: 'center' });

    if (subtitle) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text(subtitle, pageWidth / 2, 36, { align: 'center' });
    }

    // ===== CARTOUCHE INFORMATIONS STRUCTURE =====
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.line(10, 42, pageWidth - 10, 42);

    doc.setFontSize(5.5);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');

    const orgInfo = org ? [
      `${org.adresseSiege || ''} - ${org.codePostalSiege || ''} ${org.villeSiege || ''}`,
      `Tél: ${org.telephoneSiege || 'N/A'} | Email: ${org.emailSiege || 'N/A'}`,
      org.conventions?.[0] ? `Convention ${org.conventions[0].typeStructure} n°${org.conventions[0].numeroConvention} | ${org.conventions[0].effectifETPAutorise} ETP autorisés` : ''
    ].filter(Boolean).join('  •  ') : '';

    doc.text(orgInfo, pageWidth / 2, 46, { align: 'center' });

    doc.setDrawColor(220, 220, 220);
    doc.line(10, 49, pageWidth - 10, 49);

    return 54;
  };

  // Helper pour pied de page professionnel ISO
  const addPDFFooterPro = (doc: jsPDF, docRef: string) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const org = organismeData;
    const pageCount = doc.internal.pages.length - 1;

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      // Bandeau de pied de page
      doc.setFillColor(248, 250, 252);
      doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');

      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.2);
      doc.line(10, pageHeight - 20, pageWidth - 10, pageHeight - 20);

      // Colonne gauche - Infos structure
      doc.setFontSize(5);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.text(`${org?.raisonSociale || 'Structure IAE'}`, 10, pageHeight - 15);
      doc.text(`${org?.formeJuridique || ''} - SIRET: ${org?.siret || 'N/A'} - APE: ${org?.codeAPE || 'N/A'}`, 10, pageHeight - 11);
      if (org?.iban) {
        doc.text(`IBAN: ${org.iban} - BIC: ${org.bic || 'N/A'}`, 10, pageHeight - 7);
      }

      // Colonne centre - Réf document et conformité
      doc.setFontSize(5);
      doc.setFont('helvetica', 'bold');
      doc.text('Réf:', pageWidth / 2 - 20, pageHeight - 15);
      doc.setFont('helvetica', 'normal');
      doc.text(docRef, pageWidth / 2 - 14, pageHeight - 15);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(4.5);
      doc.text('Document conforme aux exigences de suivi IAE - Art. L5132-1 Code du travail', pageWidth / 2, pageHeight - 10, { align: 'center' });
      doc.text(`Édité le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, pageWidth / 2, pageHeight - 6, { align: 'center' });

      // Colonne droite - Pagination
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(60, 60, 60);
      doc.text(`${i} / ${pageCount}`, pageWidth - 15, pageHeight - 10, { align: 'right' });
    }
  };

  // Helper pour section avec titre
  const addSection = (doc: jsPDF, y: number, title: string, pageWidth: number): number => {
    doc.setFillColor(55, 65, 81);
    doc.rect(10, y, pageWidth - 20, 5, 'F');
    doc.setTextColor(255);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.text(title.toUpperCase(), 12, y + 3.5);
    return y + 7;
  };

  // PDF Fiche Salarié Complète - VERSION PRO
  const generateFicheSalariePDF = (employee: InsertionEmployee) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const docRef = generateDocReference('FI', employee.id);

    let y = addPDFHeaderPro(doc, {
      title: 'Fiche Individuelle Salarié en Insertion',
      docType: 'FI',
      docRef,
      version: '1.0',
      classification: 'CONFIDENTIEL',
      subtitle: `${employee.civilite} ${employee.prenom} ${employee.nom.toUpperCase()} - Matricule: ${employee.id.substring(0, 8).toUpperCase()}`
    });

    // ===== ENCART SYNTHÈSE =====
    doc.setFillColor(240, 245, 250);
    doc.roundedRect(10, y, pageWidth - 20, 22, 2, 2, 'F');

    // Photo placeholder
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(12, y + 2, 18, 18, 1, 1, 'FD');
    doc.setFontSize(4);
    doc.setTextColor(150);
    doc.text('PHOTO', 21, y + 12, { align: 'center' });

    // Infos synthèse
    doc.setTextColor(35, 41, 54);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`${employee.prenom} ${employee.nom.toUpperCase()}`, 34, y + 6);

    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`${employee.typeContrat} | ${employee.dureeHebdo}h/semaine | ${employee.poste || 'Poste non défini'}`, 34, y + 11);
    doc.text(`Entrée: ${formatDate(employee.dateEntree)}${employee.dateSortie ? ` - Sortie: ${formatDate(employee.dateSortie)}` : ' - En cours'}`, 34, y + 15);

    // Badges statut
    let badgeX = 34;
    const badges: { label: string; color: number[] }[] = [];
    if (employee.statut === 'actif') badges.push({ label: 'ACTIF', color: [34, 197, 94] });
    if (employee.statut === 'sorti') badges.push({ label: 'SORTI', color: [107, 114, 128] });
    if (employee.beneficiaireRSA) badges.push({ label: 'RSA', color: [59, 130, 246] });
    if (employee.beneficiaireASS) badges.push({ label: 'ASS', color: [139, 92, 246] });
    if (employee.reconnaissanceTH) badges.push({ label: 'RQTH', color: [236, 72, 153] });
    if (employee.passInclusionNumero) badges.push({ label: 'PASS IAE', color: [16, 185, 129] });

    badges.slice(0, 6).forEach(b => {
      doc.setFillColor(...b.color as [number, number, number]);
      const w = doc.getTextWidth(b.label) * 0.8 + 3;
      doc.roundedRect(badgeX, y + 17, w, 4, 0.8, 0.8, 'F');
      doc.setTextColor(255);
      doc.setFontSize(4.5);
      doc.setFont('helvetica', 'bold');
      doc.text(b.label, badgeX + 1.5, y + 19.8);
      badgeX += w + 2;
    });

    // Indicateurs à droite
    const rightCol = pageWidth - 55;
    doc.setTextColor(35, 41, 54);
    doc.setFontSize(5);
    doc.setFont('helvetica', 'bold');
    doc.text('N° Sécurité Sociale', rightCol, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(employee.numeroSecu || 'Non renseigné', rightCol, y + 9);

    doc.setFont('helvetica', 'bold');
    doc.text('Pass IAE', rightCol, y + 14);
    doc.setFont('helvetica', 'normal');
    doc.text(employee.passInclusionNumero || 'Non renseigné', rightCol, y + 18);

    y += 26;

    // ===== ÉTAT CIVIL =====
    y = addSection(doc, y, 'État Civil', pageWidth);

    doc.setFontSize(6);
    doc.setTextColor(35, 41, 54);
    const col1 = 12, col2 = 42, col3 = 75, col4 = 105, col5 = 140, col6 = 170;

    const addDataRow = (items: [string, string][]) => {
      items.forEach((item, idx) => {
        const colLabel = idx === 0 ? col1 : idx === 1 ? col3 : col5;
        const colValue = idx === 0 ? col2 : idx === 1 ? col4 : col6;
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100);
        doc.text(item[0], colLabel, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(35, 41, 54);
        doc.text(item[1].substring(0, 25), colValue, y);
      });
      y += 4.5;
    };

    addDataRow([['Civilité:', employee.civilite], ['Nom:', employee.nom.toUpperCase()], ['Prénom:', employee.prenom]]);
    addDataRow([['Nom usage:', employee.nomUsage || '-'], ['Né(e) le:', formatDate(employee.dateNaissance)], ['Lieu:', employee.lieuNaissance || '-']]);
    addDataRow([['Nationalité:', employee.nationalite || 'Française'], ['N° Sécu:', employee.numeroSecu || '-'], ['', '']]);
    y += 2;

    // ===== COORDONNÉES =====
    y = addSection(doc, y, 'Coordonnées', pageWidth);
    addDataRow([['Adresse:', employee.adresse?.substring(0, 40) || '-'], ['', ''], ['', '']]);
    addDataRow([['CP / Ville:', `${employee.codePostal} ${employee.ville}`], ['', ''], ['', '']]);
    addDataRow([['Téléphone:', employee.telephone || '-'], ['Tél. 2:', employee.telephoneSecondaire || '-'], ['Email:', employee.email?.substring(0, 25) || '-']]);
    y += 2;

    // ===== SITUATION PERSONNELLE =====
    y = addSection(doc, y, 'Situation Personnelle', pageWidth);
    addDataRow([['Sit. familiale:', employee.situationFamiliale || '-'], ['Enfants:', String(employee.nombreEnfants || 0)], ['', '']]);
    addDataRow([['Permis:', employee.permisConduire ? `Oui (${employee.typePermis || 'B'})` : 'Non'], ['Véhicule:', employee.vehicule ? 'Oui' : 'Non'], ['', '']]);
    addDataRow([['Pièce ID:', employee.typePieceIdentite || '-'], ['N° pièce:', employee.numeroPieceIdentite || '-'], ['Exp.:', employee.dateExpirationPiece ? formatDate(employee.dateExpirationPiece) : '-']]);
    y += 2;

    // ===== SITUATION ADMINISTRATIVE IAE =====
    y = addSection(doc, y, 'Situation Administrative & Éligibilité IAE', pageWidth);
    addDataRow([['France Travail:', employee.inscritFranceTravail ? 'Oui' : 'Non'], ['N° FT:', employee.numeroFranceTravail || '-'], ['Éligibilité:', employee.eligibiliteIAE || '-']]);
    addDataRow([['RSA:', employee.beneficiaireRSA ? 'Oui' : 'Non'], ['ASS:', employee.beneficiaireASS ? 'Oui' : 'Non'], ['AAH:', employee.beneficiaireAAH ? 'Oui' : 'Non']]);
    addDataRow([['RQTH:', employee.reconnaissanceTH ? 'Oui' : 'Non'], ['Pass IAE:', employee.passInclusionNumero || '-'], ['Exp. Pass:', employee.passInclusionExpiration ? formatDate(employee.passInclusionExpiration) : '-']]);
    y += 2;

    // ===== CONTRAT DE TRAVAIL =====
    y = addSection(doc, y, 'Contrat de Travail', pageWidth);
    addDataRow([['Type:', employee.typeContrat], ['Durée:', `${employee.dureeHebdo}h/sem`], ['Poste:', employee.poste || '-']]);
    addDataRow([['Entrée:', formatDate(employee.dateEntree)], ['Sortie:', employee.dateSortie ? formatDate(employee.dateSortie) : 'En cours'], ['Salaire:', employee.salaireBrut ? `${employee.salaireBrut}€ brut` : '-']]);
    if (employee.dateSortie) {
      addDataRow([['Motif sortie:', employee.motifSortie || '-'], ['Type sortie:', employee.typeSortie || '-'], ['', '']]);
    }
    y += 2;

    // ===== TABLEAU SUIVIS =====
    if (employee.suivis && employee.suivis.length > 0) {
      y = addSection(doc, y, `Historique Accompagnement (${employee.suivis.length} entretien${employee.suivis.length > 1 ? 's' : ''})`, pageWidth);

      autoTable(doc, {
        startY: y,
        head: [['Date', 'Type', 'Durée', 'Objet de l\'entretien', 'Conseiller']],
        body: employee.suivis.slice(0, 6).map((s: any) => [
          formatDate(s.dateEntretien),
          s.typeEntretien || '-',
          s.duree ? `${s.duree}min` : '-',
          (s.objetEntretien || '-').substring(0, 45),
          s.conseillerNom || '-'
        ]),
        styles: { fontSize: 5.5, cellPadding: 1.5 },
        headStyles: { fillColor: [248, 250, 252], textColor: [55, 65, 81], fontSize: 5.5, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [255, 255, 255] },
        margin: { left: 10, right: 10 },
        tableWidth: pageWidth - 20,
        columnStyles: { 0: { cellWidth: 22 }, 1: { cellWidth: 24 }, 2: { cellWidth: 16 }, 3: { cellWidth: 'auto' }, 4: { cellWidth: 32 } }
      });
    }

    // ===== NOTES =====
    const finalY = (doc as any).lastAutoTable?.finalY || y;
    if (employee.notes) {
      doc.setFontSize(5);
      doc.setTextColor(100);
      doc.setFont('helvetica', 'italic');
      doc.text(`Observations: ${employee.notes.substring(0, 300)}`, 10, finalY + 6);
    }

    addPDFFooterPro(doc, docRef);
    doc.save(`FI_${employee.nom.toUpperCase()}_${employee.prenom}_${docRef}.pdf`);
  };

  // PDF Rapport de Suivi d'un salarié - VERSION PRO
  const generateRapportSuiviPDF = (employee: InsertionEmployee) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const docRef = generateDocReference('RS', employee.id);

    // Calcul durée parcours
    const dateEntree = new Date(employee.dateEntree);
    const dateFin = employee.dateSortie ? new Date(employee.dateSortie) : new Date();
    const dureeMois = Math.floor((dateFin.getTime() - dateEntree.getTime()) / (1000 * 60 * 60 * 24 * 30));

    let y = addPDFHeaderPro(doc, {
      title: 'Rapport de Suivi Socioprofessionnel',
      docType: 'RS',
      docRef,
      version: '1.0',
      classification: 'CONFIDENTIEL',
      subtitle: `${employee.civilite} ${employee.prenom} ${employee.nom.toUpperCase()} - Parcours de ${dureeMois} mois`
    });

    // ===== SYNTHÈSE DU PARCOURS =====
    doc.setFillColor(240, 245, 250);
    doc.roundedRect(10, y, pageWidth - 20, 28, 2, 2, 'F');

    // Colonne gauche - Identité
    doc.setTextColor(35, 41, 54);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('BÉNÉFICIAIRE', 14, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.text(`${employee.civilite} ${employee.prenom} ${employee.nom.toUpperCase()}`, 14, y + 10);
    doc.text(`Né(e) le ${formatDate(employee.dateNaissance)}`, 14, y + 14);
    doc.text(`N° Sécu: ${employee.numeroSecu || 'Non renseigné'}`, 14, y + 18);
    doc.text(`Pass IAE: ${employee.passInclusionNumero || 'Non renseigné'}`, 14, y + 22);

    // Colonne centre - Contrat
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('CONTRAT', 70, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.text(`Type: ${employee.typeContrat} - ${employee.dureeHebdo}h/sem`, 70, y + 10);
    doc.text(`Poste: ${employee.poste || 'Non défini'}`, 70, y + 14);
    doc.text(`Entrée: ${formatDate(employee.dateEntree)}`, 70, y + 18);
    doc.text(`${employee.dateSortie ? `Sortie: ${formatDate(employee.dateSortie)}` : 'Statut: En cours'}`, 70, y + 22);

    // Colonne droite - Indicateurs
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('INDICATEURS', 130, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.text(`Durée parcours: ${dureeMois} mois`, 130, y + 10);
    doc.text(`Entretiens: ${employee.suivis?.length || 0}`, 130, y + 14);
    doc.text(`PMSMP: ${employee.conventionsPMSMP?.length || 0}`, 130, y + 18);
    doc.text(`Formations: ${employee.formations?.length || 0}`, 130, y + 22);

    y += 32;

    // ===== PROJET PROFESSIONNEL =====
    if (employee.fichePro) {
      y = addSection(doc, y, 'Projet Professionnel & Objectifs', pageWidth);

      doc.setFontSize(6);
      doc.setTextColor(35, 41, 54);

      if (employee.fichePro.projetPro) {
        doc.setFont('helvetica', 'bold');
        doc.text('Projet:', 12, y);
        doc.setFont('helvetica', 'normal');
        const projetLines = doc.splitTextToSize(employee.fichePro.projetPro, pageWidth - 35);
        doc.text(projetLines.slice(0, 2), 30, y);
        y += projetLines.slice(0, 2).length * 4 + 2;
      }

      if (employee.fichePro.metiersVises) {
        doc.setFont('helvetica', 'bold');
        doc.text('Métiers visés:', 12, y);
        doc.setFont('helvetica', 'normal');
        doc.text(employee.fichePro.metiersVises.substring(0, 80), 38, y);
        y += 5;
      }

      // Objectifs sur 2 colonnes
      const hasObj = employee.fichePro.objectifsCourt || employee.fichePro.objectifsMoyen || employee.fichePro.objectifsLong;
      if (hasObj) {
        doc.setFont('helvetica', 'bold');
        doc.text('Court terme:', 12, y);
        doc.setFont('helvetica', 'normal');
        doc.text((employee.fichePro.objectifsCourt || '-').substring(0, 50), 35, y);
        doc.setFont('helvetica', 'bold');
        doc.text('Moyen terme:', 100, y);
        doc.setFont('helvetica', 'normal');
        doc.text((employee.fichePro.objectifsMoyen || '-').substring(0, 50), 125, y);
        y += 5;
      }

      // Freins identifiés
      const freins: string[] = [];
      if (employee.fichePro.freinsMobilite) freins.push('Mobilité');
      if (employee.fichePro.freinsLogement) freins.push('Logement');
      if (employee.fichePro.freinsSante) freins.push('Santé');
      if (employee.fichePro.freinsGardeEnfants) freins.push('Garde enfants');
      if (employee.fichePro.freinsLangue) freins.push('Langue');
      if (employee.fichePro.freinsNumerique) freins.push('Numérique');

      if (freins.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('Freins identifiés:', 12, y);
        doc.setFont('helvetica', 'normal');
        doc.text(freins.join(' | '), 42, y);
        y += 5;
      }
      y += 3;
    }

    // ===== HISTORIQUE ENTRETIENS =====
    if (employee.suivis && employee.suivis.length > 0) {
      y = addSection(doc, y, `Historique des Entretiens de Suivi (${employee.suivis.length})`, pageWidth);

      autoTable(doc, {
        startY: y,
        head: [['Date', 'Type', 'Durée', 'Conseiller', 'Objet de l\'entretien', 'Actions décidées']],
        body: employee.suivis.map((s: any) => [
          formatDate(s.dateEntretien),
          s.typeEntretien || '-',
          s.duree ? `${s.duree}min` : '-',
          s.conseillerNom || '-',
          (s.objetEntretien || '-').substring(0, 40),
          (s.actionsDecidees || '-').substring(0, 35)
        ]),
        styles: { fontSize: 5.5, cellPadding: 1.2 },
        headStyles: { fillColor: [55, 65, 81], fontSize: 5.5, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 10, right: 10 },
        columnStyles: { 0: { cellWidth: 18 }, 1: { cellWidth: 18 }, 2: { cellWidth: 12 }, 3: { cellWidth: 25 }, 4: { cellWidth: 50 }, 5: { cellWidth: 45 } }
      });
      y = (doc as any).lastAutoTable.finalY + 5;
    }

    // ===== PMSMP =====
    if (employee.conventionsPMSMP && employee.conventionsPMSMP.length > 0) {
      y = addSection(doc, y, `Immersions Professionnelles - PMSMP (${employee.conventionsPMSMP.length})`, pageWidth);

      autoTable(doc, {
        startY: y,
        head: [['Entreprise d\'accueil', 'Période', 'Durée', 'Statut', 'Évaluation', 'Suite envisagée']],
        body: employee.conventionsPMSMP.map((p: any) => [
          p.entrepriseNom,
          `${formatDate(p.dateDebut)} - ${formatDate(p.dateFin)}`,
          p.dureeJours ? `${p.dureeJours}j` : '-',
          p.statut,
          p.evaluationEntreprise || '-',
          p.suiteEnvisagee || '-'
        ]),
        styles: { fontSize: 5.5, cellPadding: 1.2 },
        headStyles: { fillColor: [55, 65, 81], fontSize: 5.5, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 10, right: 10 }
      });
      y = (doc as any).lastAutoTable.finalY + 5;
    }

    // ===== FORMATIONS =====
    if (employee.formations && employee.formations.length > 0) {
      y = addSection(doc, y, `Formations Suivies (${employee.formations.length})`, pageWidth);

      autoTable(doc, {
        startY: y,
        head: [['Intitulé', 'Organisme', 'Type', 'Période', 'Durée', 'Résultat']],
        body: employee.formations.map((f: any) => [
          f.intitule?.substring(0, 35) || '-',
          f.organisme?.substring(0, 20) || '-',
          f.type || '-',
          `${formatDate(f.dateDebut)}${f.dateFin ? ` - ${formatDate(f.dateFin)}` : ''}`,
          f.dureeHeures ? `${f.dureeHeures}h` : '-',
          f.resultat || f.statut || '-'
        ]),
        styles: { fontSize: 5.5, cellPadding: 1.2 },
        headStyles: { fillColor: [55, 65, 81], fontSize: 5.5, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 10, right: 10 }
      });
      y = (doc as any).lastAutoTable.finalY + 5;
    }

    // ===== OBJECTIFS INDIVIDUELS =====
    if (employee.objectifsIndividuels && employee.objectifsIndividuels.length > 0) {
      y = addSection(doc, y, `Objectifs Individuels (${employee.objectifsIndividuels.length})`, pageWidth);

      autoTable(doc, {
        startY: y,
        head: [['Objectif', 'Catégorie', 'Échéance', 'Progression', 'Statut']],
        body: employee.objectifsIndividuels.map((o: any) => [
          o.titre?.substring(0, 50) || '-',
          o.categorie || '-',
          o.dateEcheance ? formatDate(o.dateEcheance) : '-',
          `${o.progression || 0}%`,
          o.statut || '-'
        ]),
        styles: { fontSize: 5.5, cellPadding: 1.2 },
        headStyles: { fillColor: [55, 65, 81], fontSize: 5.5, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 10, right: 10 }
      });
    }

    // ===== BILAN SORTIE si sorti =====
    if (employee.dateSortie && employee.fichePro?.bilanSortie) {
      const finalY = (doc as any).lastAutoTable?.finalY || y;
      doc.setFillColor(245, 247, 250);
      doc.roundedRect(10, finalY + 5, pageWidth - 20, 18, 2, 2, 'F');
      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(35, 41, 54);
      doc.text('BILAN DE SORTIE', 14, finalY + 10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Type de sortie: ${employee.typeSortie || '-'} | Motif: ${employee.motifSortie || '-'}`, 14, finalY + 15);
      doc.text(`Situation à la sortie: ${employee.fichePro.situationSortie || '-'}`, 14, finalY + 20);
    }

    addPDFFooterPro(doc, docRef);
    doc.save(`RS_${employee.nom.toUpperCase()}_${employee.prenom}_${docRef}.pdf`);
  };

  // PDF Synthèse des Effectifs
  const generateSyntheseEffectifsPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // En-tête
    doc.setFillColor(147, 51, 234);
    doc.rect(0, 0, pageWidth, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('SYNTHÈSE DES EFFECTIFS', pageWidth / 2, 18, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`SALARIÉS EN INSERTION - ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, 30, { align: 'center' });

    y = 50;
    doc.setTextColor(0, 0, 0);

    // Statistiques globales
    const actifs = employees.filter(e => e.statut === 'actif');
    const sortis = employees.filter(e => e.statut === 'sorti');
    const sortiesPositives = sortis.filter(e => e.typeSortie === 'positive');

    doc.setFillColor(241, 245, 249);
    doc.rect(15, y, pageWidth - 30, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('INDICATEURS CLÉS', 20, y + 6);
    y += 20;

    // KPIs en colonnes
    const kpis = [
      { label: 'Effectif total', value: employees.length.toString() },
      { label: 'Salariés actifs', value: actifs.length.toString() },
      { label: 'Sorties', value: sortis.length.toString() },
      { label: 'Sorties positives', value: `${sortiesPositives.length} (${sortis.length > 0 ? Math.round(sortiesPositives.length / sortis.length * 100) : 0}%)` }
    ];

    doc.setFontSize(10);
    let xPos = 25;
    kpis.forEach((kpi, idx) => {
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(xPos, y, 40, 25, 3, 3, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(30, 58, 138);
      doc.text(kpi.value, xPos + 20, y + 12, { align: 'center' });
      doc.setFontSize(7);
      doc.setTextColor(100);
      doc.text(kpi.label, xPos + 20, y + 20, { align: 'center' });
      xPos += 45;
    });

    y += 40;
    doc.setTextColor(0, 0, 0);

    // Répartition par type de contrat
    doc.setFillColor(241, 245, 249);
    doc.rect(15, y, pageWidth - 30, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('RÉPARTITION PAR TYPE DE CONTRAT', 20, y + 6);
    y += 15;

    const contratTypes: Record<string, number> = {};
    actifs.forEach(e => {
      contratTypes[e.typeContrat] = (contratTypes[e.typeContrat] || 0) + 1;
    });

    autoTable(doc, {
      startY: y,
      head: [['Type de contrat', 'Nombre', 'Pourcentage']],
      body: Object.entries(contratTypes).map(([type, count]) => [
        type,
        count.toString(),
        `${Math.round((count as number) / actifs.length * 100)}%`
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [147, 51, 234] },
      margin: { left: 20, right: 20 }
    });

    y = (doc as any).lastAutoTable.finalY + 15;

    // Liste des salariés actifs
    doc.setFillColor(241, 245, 249);
    doc.rect(15, y, pageWidth - 30, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('LISTE DES SALARIÉS ACTIFS', 20, y + 6);
    y += 12;

    autoTable(doc, {
      startY: y,
      head: [['Nom', 'Prénom', 'Poste', 'Contrat', 'Entrée', 'Heures/sem']],
      body: actifs.map(e => [
        e.nom,
        e.prenom,
        e.poste || '-',
        e.typeContrat,
        formatDate(e.dateEntree),
        `${e.dureeHebdo}h`
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [147, 51, 234] },
      margin: { left: 15, right: 15 }
    });

    // Si des sorties, les lister
    if (sortis.length > 0) {
      y = (doc as any).lastAutoTable.finalY + 15;
      doc.setFillColor(241, 245, 249);
      doc.rect(15, y, pageWidth - 30, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('SORTIES', 20, y + 6);
      y += 12;

      autoTable(doc, {
        startY: y,
        head: [['Nom', 'Prénom', 'Sortie', 'Type', 'Motif']],
        body: sortis.map(e => [
          e.nom,
          e.prenom,
          formatDate(e.dateSortie),
          e.typeSortie === 'positive' ? '✓ Positive' : 'Autre',
          e.motifSortie || '-'
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [147, 51, 234] },
        margin: { left: 15, right: 15 }
      });
    }

    // Pied de page
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.text(`Synthèse générée le ${new Date().toLocaleDateString('fr-FR')} - Page ${i}/${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }

    doc.save(`Synthese_Effectifs_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // PDF Attestation d'emploi - VERSION PRO
  const generateAttestationEmploiPDF = (employee: InsertionEmployee) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const docRef = generateDocReference('AE', employee.id);
    const org = organismeData;

    // ===== EN-TÊTE STRUCTURE =====
    // Bandeau sobre
    doc.setFillColor(35, 41, 54);
    doc.rect(0, 0, pageWidth, 32, 'F');

    // Logo zone (gauche)
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(12, 6, 20, 20, 2, 2, 'F');
    doc.setFontSize(5);
    doc.setTextColor(150);
    doc.text('LOGO', 22, 17, { align: 'center' });

    // Nom et infos structure
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(org?.raisonSociale?.toUpperCase() || 'STRUCTURE D\'INSERTION', 38, 12);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 200, 200);
    doc.text(org?.formeJuridique || 'Structure d\'Insertion par l\'Activité Économique', 38, 18);
    doc.text(`${org?.adresseSiege || ''} - ${org?.codePostalSiege || ''} ${org?.villeSiege || ''}`, 38, 23);
    doc.text(`SIRET: ${org?.siret || 'N/A'} | Tél: ${org?.telephoneSiege || 'N/A'}`, 38, 28);

    // Référence document (droite)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(5);
    doc.setFont('helvetica', 'bold');
    doc.text('Réf. Document', pageWidth - 40, 10);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text(docRef, pageWidth - 40, 15);
    doc.text(`Édité le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - 40, 20);

    // ===== TITRE =====
    let y = 50;
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 38, pageWidth, 20, 'F');

    doc.setTextColor(35, 41, 54);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ATTESTATION D\'EMPLOI', pageWidth / 2, 50, { align: 'center' });

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(10, 58, pageWidth - 10, 58);

    // ===== CORPS DU DOCUMENT =====
    y = 68;

    // Section émetteur
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(35, 41, 54);

    const representant = org?.representantNom && org?.representantPrenom
      ? `${org.representantPrenom} ${org.representantNom.toUpperCase()}`
      : '[Représentant légal]';
    const fonction = org?.representantFonction || '[Fonction]';

    doc.text(`Je soussigné(e), ${representant},`, 20, y);
    y += 5;
    doc.text(`agissant en qualité de ${fonction} de la structure ${org?.raisonSociale || '[Nom structure]'},`, 20, y);
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.text('ATTESTE QUE :', 20, y);
    y += 10;

    // Encadré bénéficiaire
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(20, y, pageWidth - 40, 28, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`${employee.civilite} ${employee.prenom} ${employee.nom.toUpperCase()}`, 25, y + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`Né(e) le ${formatDate(employee.dateNaissance)}${employee.lieuNaissance ? ` à ${employee.lieuNaissance}` : ''}`, 25, y + 14);
    doc.text(`Demeurant: ${employee.adresse}`, 25, y + 19);
    doc.text(`${employee.codePostal} ${employee.ville}`, 25, y + 24);

    y += 35;

    // Texte attestation
    doc.setFontSize(8);
    const dateEntree = formatDate(employee.dateEntree);
    const texteEmploi = employee.dateSortie
      ? `a été employé(e) au sein de notre structure du ${dateEntree} au ${formatDate(employee.dateSortie)}`
      : `est employé(e) au sein de notre structure depuis le ${dateEntree}`;

    doc.text(texteEmploi, 20, y);
    y += 6;
    doc.text(`en qualité de ${employee.poste || 'Salarié(e) en insertion'}.`, 20, y);
    y += 12;

    // Tableau récapitulatif contrat
    doc.setFillColor(55, 65, 81);
    doc.rect(20, y, pageWidth - 40, 6, 'F');
    doc.setTextColor(255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('CARACTÉRISTIQUES DU CONTRAT', 25, y + 4);
    y += 8;

    doc.setTextColor(35, 41, 54);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);

    const contratData = [
      ['Type de contrat', employee.typeContrat],
      ['Durée hebdomadaire', `${employee.dureeHebdo} heures`],
      ['Date d\'entrée', dateEntree],
      ['Poste occupé', employee.poste || 'Salarié(e) en insertion']
    ];

    if (employee.dateSortie) {
      contratData.push(['Date de sortie', formatDate(employee.dateSortie)]);
    }
    if (employee.salaireBrut) {
      contratData.push(['Rémunération brute mensuelle', `${employee.salaireBrut} €`]);
    }

    contratData.forEach((row, idx) => {
      const bgColor = idx % 2 === 0 ? [248, 250, 252] : [255, 255, 255];
      doc.setFillColor(...bgColor as [number, number, number]);
      doc.rect(20, y, pageWidth - 40, 5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.text(row[0], 25, y + 3.5);
      doc.setFont('helvetica', 'normal');
      doc.text(row[1], 90, y + 3.5);
      y += 5;
    });

    // Cadre convention si disponible
    if (org?.conventions?.[0]) {
      y += 8;
      doc.setFillColor(240, 245, 250);
      doc.roundedRect(20, y, pageWidth - 40, 12, 2, 2, 'F');
      doc.setFontSize(6);
      doc.setTextColor(80, 80, 80);
      doc.text(`Cette embauche s'inscrit dans le cadre de la convention ${org.conventions[0].typeStructure} n°${org.conventions[0].numeroConvention}`, 25, y + 5);
      doc.text(`conclue avec l'État (DREETS/DDETS) pour la période du ${formatDate(org.conventions[0].dateDebut)} au ${formatDate(org.conventions[0].dateFin)}.`, 25, y + 9);
      y += 15;
    }

    // Mention légale
    y += 10;
    doc.setFontSize(8);
    doc.setTextColor(35, 41, 54);
    doc.setFont('helvetica', 'normal');
    doc.text('Cette attestation est délivrée pour servir et valoir ce que de droit.', 20, y);

    // ===== SIGNATURE =====
    y += 20;
    doc.text(`Fait à ${org?.villeSiege || '____________________'}, le ${new Date().toLocaleDateString('fr-FR')}`, 20, y);

    y += 15;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('Signature et cachet de la structure', pageWidth - 80, y);

    // Zone signature
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(pageWidth - 80, y + 3, 60, 35, 2, 2, 'FD');

    // Nom du signataire sous la zone
    y += 42;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(100, 100, 100);
    doc.text(representant, pageWidth - 50, y, { align: 'center' });
    doc.text(fonction, pageWidth - 50, y + 4, { align: 'center' });

    // ===== PIED DE PAGE =====
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(10, pageHeight - 22, pageWidth - 10, pageHeight - 22);

    doc.setFontSize(5);
    doc.setTextColor(120, 120, 120);
    doc.setFont('helvetica', 'normal');
    doc.text(`${org?.raisonSociale || 'Structure IAE'} - ${org?.formeJuridique || ''} - SIRET: ${org?.siret || 'N/A'} - APE: ${org?.codeAPE || 'N/A'}`, 10, pageHeight - 16);
    if (org?.iban) {
      doc.text(`Coordonnées bancaires: IBAN ${org.iban} - BIC ${org.bic || 'N/A'}`, 10, pageHeight - 12);
    }
    doc.text(`Réf: ${docRef} | Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, 10, pageHeight - 8);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(4.5);
    doc.text('Ce document est établi conformément aux dispositions du Code du travail relatives à l\'Insertion par l\'Activité Économique (Art. L5132-1 et suivants).', pageWidth / 2, pageHeight - 4, { align: 'center' });

    doc.save(`AE_${employee.nom.toUpperCase()}_${employee.prenom}_${docRef}.pdf`);
  };

  // =================== FIN GENERATION PDF ===================

  // =================== AGENDA (Google Calendar Style) ===================

  const renderAgenda = () => {
    const moisNoms = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const moisNomsShort = ['', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const joursNoms = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];
    const joursNomsShort = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

    const aujourdHui = new Date();
    const aujourdHuiStr = `${aujourdHui.getFullYear()}-${String(aujourdHui.getMonth() + 1).padStart(2, '0')}-${String(aujourdHui.getDate()).padStart(2, '0')}`;

    const changerMois = (delta: number) => {
      let newMois = agendaMois + delta;
      let newAnnee = agendaAnnee;
      if (newMois < 1) { newMois = 12; newAnnee--; }
      if (newMois > 12) { newMois = 1; newAnnee++; }
      setAgendaMois(newMois);
      setAgendaAnnee(newAnnee);
    };

    // Générer les jours pour le mini calendrier
    const genererMiniCalendrier = (mois: number, annee: number) => {
      const premierJour = new Date(annee, mois - 1, 1);
      const dernierJour = new Date(annee, mois, 0);
      const nbJours = dernierJour.getDate();
      let jourDebutSemaine = premierJour.getDay();
      jourDebutSemaine = jourDebutSemaine === 0 ? 6 : jourDebutSemaine - 1;

      const jours: { jour: number; estMoisCourant: boolean; dateStr: string }[] = [];
      const dernierJourMoisPrec = new Date(annee, mois - 1, 0).getDate();

      for (let i = jourDebutSemaine - 1; i >= 0; i--) {
        const d = dernierJourMoisPrec - i;
        const m = mois === 1 ? 12 : mois - 1;
        const a = mois === 1 ? annee - 1 : annee;
        jours.push({ jour: d, estMoisCourant: false, dateStr: `${a}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` });
      }

      for (let d = 1; d <= nbJours; d++) {
        jours.push({ jour: d, estMoisCourant: true, dateStr: `${annee}-${String(mois).padStart(2, '0')}-${String(d).padStart(2, '0')}` });
      }

      const joursRestants = 42 - jours.length;
      for (let d = 1; d <= joursRestants; d++) {
        const m = mois === 12 ? 1 : mois + 1;
        const a = mois === 12 ? annee + 1 : annee;
        jours.push({ jour: d, estMoisCourant: false, dateStr: `${a}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` });
      }

      return jours;
    };

    // Générer les jours du calendrier principal
    const genererJoursCalendrier = () => {
      const premierJour = new Date(agendaAnnee, agendaMois - 1, 1);
      const dernierJour = new Date(agendaAnnee, agendaMois, 0);
      const nbJours = dernierJour.getDate();
      let jourDebutSemaine = premierJour.getDay();
      jourDebutSemaine = jourDebutSemaine === 0 ? 6 : jourDebutSemaine - 1;

      const jours: { jour: number; estMoisCourant: boolean; dateStr: string; date: Date }[] = [];
      const dernierJourMoisPrec = new Date(agendaAnnee, agendaMois - 1, 0).getDate();

      for (let i = jourDebutSemaine - 1; i >= 0; i--) {
        const d = dernierJourMoisPrec - i;
        const date = new Date(agendaAnnee, agendaMois - 2, d);
        const m = agendaMois === 1 ? 12 : agendaMois - 1;
        const a = agendaMois === 1 ? agendaAnnee - 1 : agendaAnnee;
        jours.push({ jour: d, estMoisCourant: false, dateStr: `${a}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`, date });
      }

      for (let d = 1; d <= nbJours; d++) {
        const date = new Date(agendaAnnee, agendaMois - 1, d);
        jours.push({ jour: d, estMoisCourant: true, dateStr: `${agendaAnnee}-${String(agendaMois).padStart(2, '0')}-${String(d).padStart(2, '0')}`, date });
      }

      const joursRestants = 42 - jours.length;
      for (let d = 1; d <= joursRestants; d++) {
        const date = new Date(agendaAnnee, agendaMois, d);
        const m = agendaMois === 12 ? 1 : agendaMois + 1;
        const a = agendaMois === 12 ? agendaAnnee + 1 : agendaAnnee;
        jours.push({ jour: d, estMoisCourant: false, dateStr: `${a}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`, date });
      }

      return jours;
    };

    const joursCalendrier = genererJoursCalendrier();
    const miniCalJours = genererMiniCalendrier(agendaMois, agendaAnnee);

    // Obtenir les événements pour une date
    const getEventsForDate = (dateStr: string) => {
      return agendaEvents.filter(e => {
        const eventDate = new Date(e.date).toISOString().split('T')[0];
        if (e.dateEnd) {
          const endDate = new Date(e.dateEnd).toISOString().split('T')[0];
          return dateStr >= eventDate && dateStr <= endDate;
        }
        return eventDate === dateStr;
      });
    };

    const hasEventsOnDate = (dateStr: string) => getEventsForDate(dateStr).length > 0;

    const getEventColor = (type: string) => {
      const colors: Record<string, { bg: string; text: string; border: string }> = {
        'suivi': { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-600' },
        'pmsmp': { bg: 'bg-purple-500', text: 'text-white', border: 'border-purple-600' },
        'formation': { bg: 'bg-green-500', text: 'text-white', border: 'border-green-600' },
        'contrat-debut': { bg: 'bg-amber-500', text: 'text-white', border: 'border-amber-600' },
        'contrat-fin': { bg: 'bg-red-500', text: 'text-white', border: 'border-red-600' },
        'avertissement': { bg: 'bg-red-600', text: 'text-white', border: 'border-red-700' },
        'convocation': { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-600' },
        'document-expiration': { bg: 'bg-rose-500', text: 'text-white', border: 'border-rose-600' }
      };
      return colors[type] || { bg: 'bg-gray-500', text: 'text-white', border: 'border-gray-600' };
    };

    // Mini calendrier component
    const MiniCalendar = ({ mois, annee }: { mois: number; annee: number }) => {
      const jours = genererMiniCalendrier(mois, annee);
      return (
        <div className="select-none">
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => changerMois(-1)} className="p-1 hover:bg-slate-600 rounded">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className={`text-sm font-semibold ${text('text-white', 'text-gray-900')}`}>
              {moisNomsShort[mois]} {annee}
            </span>
            <button onClick={() => changerMois(1)} className="p-1 hover:bg-slate-600 rounded">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-0">
            {joursNomsShort.map(j => (
              <div key={j} className={`text-center text-[10px] font-medium py-1 ${text('text-slate-500', 'text-gray-400')}`}>{j}</div>
            ))}
            {jours.map((j, idx) => {
              const isToday = j.dateStr === aujourdHuiStr;
              const hasEvents = hasEventsOnDate(j.dateStr);
              return (
                <div
                  key={idx}
                  className={`text-center text-xs py-1 cursor-pointer rounded-full w-6 h-6 mx-auto flex items-center justify-center
                    ${!j.estMoisCourant ? 'text-slate-600' : text('text-slate-300', 'text-gray-700')}
                    ${isToday ? 'bg-blue-500 text-white font-bold' : 'hover:bg-slate-600'}
                    ${hasEvents && !isToday ? 'font-bold text-blue-400' : ''}`}
                >
                  {j.jour}
                </div>
              );
            })}
          </div>
        </div>
      );
    };

    return (
      <div className="h-full flex">
        {/* Sidebar gauche - Mini calendrier + Légende */}
        <div className={`w-64 ${bg('bg-slate-800', 'bg-gray-50')} border-r ${bg('border-slate-700', 'border-gray-200')} p-4 flex flex-col`}>
          {/* Bouton Aujourd'hui */}
          <button
            onClick={() => { setAgendaMois(aujourdHui.getMonth() + 1); setAgendaAnnee(aujourdHui.getFullYear()); }}
            className={`w-full mb-4 px-4 py-2 rounded-lg border ${bg('border-slate-600 hover:bg-slate-700', 'border-gray-300 hover:bg-gray-100')} flex items-center justify-center gap-2`}
          >
            <Calendar className="w-4 h-4" />
            <span className="font-medium">Aujourd'hui</span>
          </button>

          {/* Mini calendrier */}
          <div className={`${bg('bg-slate-700/50', 'bg-white')} rounded-lg p-3 mb-4`}>
            <MiniCalendar mois={agendaMois} annee={agendaAnnee} />
          </div>

          {/* Stats */}
          <div className={`${bg('bg-slate-700/50', 'bg-white')} rounded-lg p-3 mb-4`}>
            <h4 className={`text-xs font-semibold mb-2 ${text('text-slate-400', 'text-gray-500')}`}>CE MOIS</h4>
            <div className={`text-2xl font-bold ${text('text-white', 'text-gray-900')}`}>{agendaEvents.length}</div>
            <div className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>événements</div>
          </div>

          {/* Légende */}
          <div className={`${bg('bg-slate-700/50', 'bg-white')} rounded-lg p-3 flex-1`}>
            <h4 className={`text-xs font-semibold mb-3 ${text('text-slate-400', 'text-gray-500')}`}>CATÉGORIES</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-blue-500"></span>
                <span className={`text-xs ${text('text-slate-300', 'text-gray-600')}`}>Entretiens</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-purple-500"></span>
                <span className={`text-xs ${text('text-slate-300', 'text-gray-600')}`}>PMSMP</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-green-500"></span>
                <span className={`text-xs ${text('text-slate-300', 'text-gray-600')}`}>Formations</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-amber-500"></span>
                <span className={`text-xs ${text('text-slate-300', 'text-gray-600')}`}>Début contrat</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-red-500"></span>
                <span className={`text-xs ${text('text-slate-300', 'text-gray-600')}`}>Fin contrat</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-orange-500"></span>
                <span className={`text-xs ${text('text-slate-300', 'text-gray-600')}`}>Convocations</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-rose-500"></span>
                <span className={`text-xs ${text('text-slate-300', 'text-gray-600')}`}>Expirations</span>
              </div>
            </div>
          </div>
        </div>

        {/* Calendrier principal */}
        <div className="flex-1 flex flex-col">
          {/* Header avec navigation */}
          <div className={`h-16 ${bg('bg-slate-800', 'bg-white')} border-b ${bg('border-slate-700', 'border-gray-200')} flex items-center justify-between px-6`}>
            <div className="flex items-center gap-4">
              <h1 className={`text-xl font-bold ${text('text-white', 'text-gray-900')}`}>
                {moisNoms[agendaMois]} {agendaAnnee}
              </h1>
              <div className="flex items-center">
                <button onClick={() => changerMois(-1)} className={`p-2 ${bg('hover:bg-slate-700', 'hover:bg-gray-100')} rounded-full`}>
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={() => changerMois(1)} className={`p-2 ${bg('hover:bg-slate-700', 'hover:bg-gray-100')} rounded-full`}>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
            {agendaLoading && <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />}
          </div>

          {/* Grille du calendrier */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Jours de la semaine */}
            <div className={`grid grid-cols-7 ${bg('bg-slate-800', 'bg-gray-50')} border-b ${bg('border-slate-700', 'border-gray-200')}`}>
              {joursNoms.map((jour, idx) => (
                <div key={jour} className={`py-2 text-center text-xs font-semibold ${idx >= 5 ? 'text-slate-500' : text('text-slate-400', 'text-gray-500')}`}>
                  {jour}
                </div>
              ))}
            </div>

            {/* Grille des jours */}
            <div className="flex-1 grid grid-cols-7 grid-rows-6 overflow-hidden">
              {joursCalendrier.map((jour, idx) => {
                const events = getEventsForDate(jour.dateStr);
                const isToday = jour.dateStr === aujourdHuiStr;
                const isWeekend = idx % 7 >= 5;

                return (
                  <div
                    key={idx}
                    className={`border-b border-r ${bg('border-slate-700', 'border-gray-200')} flex flex-col overflow-hidden
                      ${!jour.estMoisCourant ? bg('bg-slate-900/30', 'bg-gray-50') : bg('bg-slate-800', 'bg-white')}
                      ${isWeekend && jour.estMoisCourant ? bg('bg-slate-800/70', 'bg-gray-50/50') : ''}`}
                  >
                    {/* Header du jour */}
                    <div className={`px-2 py-1 text-right ${!jour.estMoisCourant ? 'opacity-40' : ''}`}>
                      <span className={`inline-flex items-center justify-center w-7 h-7 text-sm rounded-full
                        ${isToday ? 'bg-blue-500 text-white font-bold' : text('text-slate-300', 'text-gray-700')}`}>
                        {jour.jour}
                      </span>
                    </div>

                    {/* Événements */}
                    <div className="flex-1 px-1 pb-1 overflow-y-auto space-y-0.5">
                      {events.map((event, eIdx) => {
                        const colors = getEventColor(event.type);
                        return (
                          <div
                            key={eIdx}
                            onClick={() => setSelectedEvent(event)}
                            className={`${colors.bg} ${colors.text} px-2 py-0.5 text-[11px] rounded cursor-pointer truncate hover:opacity-90 transition-opacity`}
                            title={`${event.title} - ${event.employee?.prenom} ${event.employee?.nom}`}
                          >
                            <span className="font-medium">{event.employee?.prenom?.[0]}{event.employee?.nom?.[0]}</span>
                            <span className="ml-1 opacity-90">{event.title.length > 20 ? event.title.substring(0, 18) + '...' : event.title}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Panel détails (s'affiche quand un événement est sélectionné) */}
        {selectedEvent && (
          <div className={`w-80 ${bg('bg-slate-800', 'bg-white')} border-l ${bg('border-slate-700', 'border-gray-200')} flex flex-col`}>
            <div className={`p-4 border-b ${bg('border-slate-700', 'border-gray-200')} flex items-center justify-between`}>
              <h3 className={`font-semibold ${text('text-white', 'text-gray-900')}`}>Détails</h3>
              <button onClick={() => setSelectedEvent(null)} className={`p-1 ${bg('hover:bg-slate-700', 'hover:bg-gray-100')} rounded`}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Couleur + Type */}
              <div className="flex items-start gap-3">
                <div className={`w-4 h-4 rounded ${getEventColor(selectedEvent.type).bg} mt-1`}></div>
                <div>
                  <h4 className={`font-semibold ${text('text-white', 'text-gray-900')}`}>{selectedEvent.title}</h4>
                  <p className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>{selectedEvent.category}</p>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-slate-400" />
                <div>
                  <p className={`text-sm ${text('text-slate-300', 'text-gray-600')}`}>
                    {new Date(selectedEvent.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  {selectedEvent.dateEnd && (
                    <p className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>
                      → {new Date(selectedEvent.dateEnd).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                  )}
                </div>
              </div>

              {/* Durée */}
              {selectedEvent.details?.duree && (
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className={`text-sm ${text('text-slate-300', 'text-gray-600')}`}>{selectedEvent.details.duree} minutes</span>
                </div>
              )}

              {/* Description */}
              {selectedEvent.description && (
                <div className={`p-3 rounded-lg ${bg('bg-slate-700/50', 'bg-gray-100')}`}>
                  <p className={`text-sm ${text('text-slate-300', 'text-gray-600')}`}>{selectedEvent.description}</p>
                </div>
              )}

              {/* Salarié */}
              <div className={`p-3 rounded-lg ${bg('bg-slate-700', 'bg-gray-100')} flex items-center gap-3`}>
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white font-medium">
                    {selectedEvent.employee?.prenom?.[0]}{selectedEvent.employee?.nom?.[0]}
                  </span>
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${text('text-white', 'text-gray-900')}`}>
                    {selectedEvent.employee?.civilite} {selectedEvent.employee?.prenom} {selectedEvent.employee?.nom}
                  </p>
                  <button
                    onClick={() => { loadEmployeeDetails(selectedEvent.employee?.id); setSelectedEvent(null); }}
                    className="text-xs text-blue-500 hover:underline"
                  >
                    Voir le dossier complet →
                  </button>
                </div>
              </div>

              {/* Infos supplémentaires */}
              {(selectedEvent.details?.conseiller || selectedEvent.details?.organisme || selectedEvent.details?.tuteur) && (
                <div className="space-y-2">
                  {selectedEvent.details?.conseiller && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className={`text-sm ${text('text-slate-300', 'text-gray-600')}`}>Conseiller: {selectedEvent.details.conseiller}</span>
                    </div>
                  )}
                  {selectedEvent.details?.organisme && (
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span className={`text-sm ${text('text-slate-300', 'text-gray-600')}`}>{selectedEvent.details.organisme}</span>
                    </div>
                  )}
                  {selectedEvent.details?.tuteur && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className={`text-sm ${text('text-slate-300', 'text-gray-600')}`}>Tuteur: {selectedEvent.details.tuteur}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // =================== RÉGLAGES OBJECTIFS ===================

  const renderReglages = () => {
    if (!objectifConfig) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      );
    }

    const handleConfigChange = (field: string, value: any) => {
      setObjectifConfig((prev: any) => ({ ...prev, [field]: value }));
    };

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-bold ${text('text-white', 'text-gray-900')}`}>Réglages des Objectifs</h1>
            <p className={`text-sm ${text('text-slate-400', 'text-gray-500')}`}>Configurez la pondération des critères de progression</p>
          </div>
          <button
            onClick={saveObjectifConfig}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>

        {/* Explication */}
        <div className={`${bg('bg-blue-500/10', 'bg-blue-50')} border ${bg('border-blue-500/30', 'border-blue-200')} rounded-xl p-4`}>
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className={`font-medium ${text('text-blue-400', 'text-blue-700')}`}>Comment fonctionne le calcul de progression ?</h4>
              <p className={`text-sm ${text('text-blue-300', 'text-blue-600')} mt-1`}>
                Chaque critère rapporte des points jusqu'à son maximum. La progression est le total des points obtenus.
                Si "Sortie positive = 100%" est activé, un salarié avec une sortie positive atteint automatiquement 100%.
              </p>
            </div>
          </div>
        </div>

        {/* Critères automatiques */}
        <div className={`${bg('bg-slate-800', 'bg-white')} rounded-xl border ${bg('border-slate-700', 'border-gray-200')} overflow-hidden`}>
          <div className={`px-6 py-4 border-b ${bg('border-slate-700', 'border-gray-200')}`}>
            <h3 className={`font-semibold ${text('text-white', 'text-gray-900')}`}>Critères automatiques</h3>
          </div>
          <div className="p-6 space-y-6">
            {/* Ancienneté */}
            <div className="grid grid-cols-3 gap-4 items-center">
              <div>
                <label className={`block text-sm font-medium ${text('text-slate-300', 'text-gray-700')}`}>Ancienneté</label>
                <p className={`text-xs ${text('text-slate-500', 'text-gray-400')}`}>Points gagnés par mois de présence</p>
              </div>
              <div>
                <label className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>Points/mois</label>
                <input
                  type="number"
                  value={objectifConfig.pointsParMoisAnciennete}
                  onChange={(e) => handleConfigChange('pointsParMoisAnciennete', parseInt(e.target.value) || 0)}
                  className={`w-full mt-1 px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`}
                />
              </div>
              <div>
                <label className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>Maximum</label>
                <input
                  type="number"
                  value={objectifConfig.poidsAnciennete}
                  onChange={(e) => handleConfigChange('poidsAnciennete', parseInt(e.target.value) || 0)}
                  className={`w-full mt-1 px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`}
                />
              </div>
            </div>

            {/* Suivis */}
            <div className="grid grid-cols-3 gap-4 items-center">
              <div>
                <label className={`block text-sm font-medium ${text('text-slate-300', 'text-gray-700')}`}>Entretiens/Suivis</label>
                <p className={`text-xs ${text('text-slate-500', 'text-gray-400')}`}>Points par entretien réalisé</p>
              </div>
              <div>
                <label className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>Points/entretien</label>
                <input
                  type="number"
                  value={objectifConfig.pointsParSuivi}
                  onChange={(e) => handleConfigChange('pointsParSuivi', parseInt(e.target.value) || 0)}
                  className={`w-full mt-1 px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`}
                />
              </div>
              <div>
                <label className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>Maximum</label>
                <input
                  type="number"
                  value={objectifConfig.poidsSuivis}
                  onChange={(e) => handleConfigChange('poidsSuivis', parseInt(e.target.value) || 0)}
                  className={`w-full mt-1 px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`}
                />
              </div>
            </div>

            {/* PMSMP */}
            <div className="grid grid-cols-3 gap-4 items-center">
              <div>
                <label className={`block text-sm font-medium ${text('text-slate-300', 'text-gray-700')}`}>PMSMP réussies</label>
                <p className={`text-xs ${text('text-slate-500', 'text-gray-400')}`}>Points par PMSMP avec bilan positif</p>
              </div>
              <div>
                <label className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>Points/PMSMP</label>
                <input
                  type="number"
                  value={objectifConfig.pointsParPMSMP}
                  onChange={(e) => handleConfigChange('pointsParPMSMP', parseInt(e.target.value) || 0)}
                  className={`w-full mt-1 px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`}
                />
              </div>
              <div>
                <label className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>Maximum</label>
                <input
                  type="number"
                  value={objectifConfig.poidsPMSMP}
                  onChange={(e) => handleConfigChange('poidsPMSMP', parseInt(e.target.value) || 0)}
                  className={`w-full mt-1 px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`}
                />
              </div>
            </div>

            {/* Formations */}
            <div className="grid grid-cols-3 gap-4 items-center">
              <div>
                <label className={`block text-sm font-medium ${text('text-slate-300', 'text-gray-700')}`}>Formations validées</label>
                <p className={`text-xs ${text('text-slate-500', 'text-gray-400')}`}>Points par formation (simple / qualifiante)</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>Simple</label>
                  <input
                    type="number"
                    value={objectifConfig.pointsFormationSimple}
                    onChange={(e) => handleConfigChange('pointsFormationSimple', parseInt(e.target.value) || 0)}
                    className={`w-full mt-1 px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`}
                  />
                </div>
                <div>
                  <label className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>Qualifiante</label>
                  <input
                    type="number"
                    value={objectifConfig.pointsFormationQualif}
                    onChange={(e) => handleConfigChange('pointsFormationQualif', parseInt(e.target.value) || 0)}
                    className={`w-full mt-1 px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`}
                  />
                </div>
              </div>
              <div>
                <label className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>Maximum</label>
                <input
                  type="number"
                  value={objectifConfig.poidsFormations}
                  onChange={(e) => handleConfigChange('poidsFormations', parseInt(e.target.value) || 0)}
                  className={`w-full mt-1 px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`}
                />
              </div>
            </div>

            {/* Objectifs individuels */}
            <div className="grid grid-cols-3 gap-4 items-center">
              <div>
                <label className={`block text-sm font-medium ${text('text-slate-300', 'text-gray-700')}`}>Objectifs individuels</label>
                <p className={`text-xs ${text('text-slate-500', 'text-gray-400')}`}>Maximum de points via objectifs manuels</p>
              </div>
              <div></div>
              <div>
                <label className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>Maximum</label>
                <input
                  type="number"
                  value={objectifConfig.poidsObjectifsIndiv}
                  onChange={(e) => handleConfigChange('poidsObjectifsIndiv', parseInt(e.target.value) || 0)}
                  className={`w-full mt-1 px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Seuils et options */}
        <div className={`${bg('bg-slate-800', 'bg-white')} rounded-xl border ${bg('border-slate-700', 'border-gray-200')} overflow-hidden`}>
          <div className={`px-6 py-4 border-b ${bg('border-slate-700', 'border-gray-200')}`}>
            <h3 className={`font-semibold ${text('text-white', 'text-gray-900')}`}>Seuils et options</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-medium ${text('text-slate-300', 'text-gray-700')} mb-2`}>
                  Progression maximum avant sortie
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={objectifConfig.seuilProgressionMax}
                    onChange={(e) => handleConfigChange('seuilProgressionMax', parseInt(e.target.value) || 0)}
                    className={`w-24 px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`}
                  />
                  <span className={text('text-slate-400', 'text-gray-500')}>%</span>
                </div>
                <p className={`text-xs ${text('text-slate-500', 'text-gray-400')} mt-1`}>
                  La progression ne peut pas dépasser ce seuil tant que le salarié n'est pas sorti
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium ${text('text-slate-300', 'text-gray-700')} mb-2`}>
                  Sortie positive = 100%
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={objectifConfig.sortiePositiveAuto100}
                    onChange={(e) => handleConfigChange('sortiePositiveAuto100', e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                  <span className={text('text-slate-300', 'text-gray-600')}>
                    Activer (sortie positive atteint automatiquement 100%)
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Récapitulatif */}
        <div className={`${bg('bg-slate-800', 'bg-white')} rounded-xl border ${bg('border-slate-700', 'border-gray-200')} p-6`}>
          <h3 className={`font-semibold ${text('text-white', 'text-gray-900')} mb-4`}>Récapitulatif des points</h3>
          <div className="grid grid-cols-5 gap-4">
            <div className={`text-center p-3 rounded-lg ${bg('bg-slate-700', 'bg-gray-100')}`}>
              <div className={`text-2xl font-bold ${text('text-white', 'text-gray-900')}`}>{objectifConfig.poidsAnciennete}</div>
              <div className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>Ancienneté</div>
            </div>
            <div className={`text-center p-3 rounded-lg ${bg('bg-slate-700', 'bg-gray-100')}`}>
              <div className={`text-2xl font-bold ${text('text-white', 'text-gray-900')}`}>{objectifConfig.poidsSuivis}</div>
              <div className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>Suivis</div>
            </div>
            <div className={`text-center p-3 rounded-lg ${bg('bg-slate-700', 'bg-gray-100')}`}>
              <div className={`text-2xl font-bold ${text('text-white', 'text-gray-900')}`}>{objectifConfig.poidsPMSMP}</div>
              <div className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>PMSMP</div>
            </div>
            <div className={`text-center p-3 rounded-lg ${bg('bg-slate-700', 'bg-gray-100')}`}>
              <div className={`text-2xl font-bold ${text('text-white', 'text-gray-900')}`}>{objectifConfig.poidsFormations}</div>
              <div className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>Formations</div>
            </div>
            <div className={`text-center p-3 rounded-lg ${bg('bg-slate-700', 'bg-gray-100')}`}>
              <div className={`text-2xl font-bold ${text('text-white', 'text-gray-900')}`}>{objectifConfig.poidsObjectifsIndiv}</div>
              <div className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>Obj. indiv.</div>
            </div>
          </div>
          <div className={`mt-4 pt-4 border-t ${bg('border-slate-700', 'border-gray-200')} flex justify-between items-center`}>
            <span className={text('text-slate-400', 'text-gray-500')}>Total possible (hors sortie positive)</span>
            <span className={`text-xl font-bold ${text('text-white', 'text-gray-900')}`}>
              {objectifConfig.poidsAnciennete + objectifConfig.poidsSuivis + objectifConfig.poidsPMSMP + objectifConfig.poidsFormations + objectifConfig.poidsObjectifsIndiv} pts
              {' '}(plafonné à {objectifConfig.seuilProgressionMax}%)
            </span>
          </div>
        </div>
      </div>
    );
  };

  // =================== ORGANISME ===================

  const renderOrganisme = () => {
    if (organismeLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      );
    }

    const convention = organismeData?.conventions?.[0];
    const objectifsNegocies = convention?.objectifsNegocies?.[0];
    const stats = dashboardObjectifs?.statsTempsReel;
    const currentYear = new Date().getFullYear();
    const moisNoms = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

    const formatMontant = (n: number) => n?.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
    const formatPourcent = (n: number) => n?.toFixed(2) + ' %';

    const getEcartColor = (ecart: number) => {
      if (ecart >= 0) return 'text-green-500';
      if (ecart >= -5) return 'text-orange-500';
      return 'text-red-500';
    };

    const renderOngletInfo = () => (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          {/* Identité */}
          <div className={`${bg('bg-slate-800', 'bg-white')} rounded-xl border ${bg('border-slate-700', 'border-gray-200')} p-6`}>
            <h3 className={`font-semibold ${text('text-white', 'text-gray-900')} mb-4 flex items-center gap-2`}>
              <Building className="w-5 h-5 text-blue-500" /> Identité de la structure
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Raison sociale</label>
                  <input type="text" value={organismeForm.raisonSociale || ''} onChange={(e) => setOrganismeForm({...organismeForm, raisonSociale: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
                </div>
                <div>
                  <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>SIRET</label>
                  <input type="text" value={organismeForm.siret || ''} onChange={(e) => setOrganismeForm({...organismeForm, siret: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Forme juridique</label>
                  <input type="text" value={organismeForm.formeJuridique || ''} onChange={(e) => setOrganismeForm({...organismeForm, formeJuridique: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} placeholder="Association" />
                </div>
                <div>
                  <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Code APE</label>
                  <input type="text" value={organismeForm.codeAPE || ''} onChange={(e) => setOrganismeForm({...organismeForm, codeAPE: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
                </div>
                <div>
                  <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>N° RNA</label>
                  <input type="text" value={organismeForm.numeroRNA || ''} onChange={(e) => setOrganismeForm({...organismeForm, numeroRNA: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
                </div>
              </div>
            </div>
          </div>

          {/* Siège social */}
          <div className={`${bg('bg-slate-800', 'bg-white')} rounded-xl border ${bg('border-slate-700', 'border-gray-200')} p-6`}>
            <h3 className={`font-semibold ${text('text-white', 'text-gray-900')} mb-4 flex items-center gap-2`}>
              <MapPin className="w-5 h-5 text-green-500" /> Siège social
            </h3>
            <div className="space-y-4">
              <div>
                <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Adresse</label>
                <input type="text" value={organismeForm.adresseSiege || ''} onChange={(e) => setOrganismeForm({...organismeForm, adresseSiege: e.target.value})}
                  className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Code postal</label>
                  <input type="text" value={organismeForm.codePostalSiege || ''} onChange={(e) => setOrganismeForm({...organismeForm, codePostalSiege: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
                </div>
                <div>
                  <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Ville</label>
                  <input type="text" value={organismeForm.villeSiege || ''} onChange={(e) => setOrganismeForm({...organismeForm, villeSiege: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Téléphone</label>
                  <input type="tel" value={organismeForm.telephoneSiege || ''} onChange={(e) => setOrganismeForm({...organismeForm, telephoneSiege: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
                </div>
                <div>
                  <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Email</label>
                  <input type="email" value={organismeForm.emailSiege || ''} onChange={(e) => setOrganismeForm({...organismeForm, emailSiege: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
                </div>
              </div>
            </div>
          </div>

          {/* Représentant légal */}
          <div className={`${bg('bg-slate-800', 'bg-white')} rounded-xl border ${bg('border-slate-700', 'border-gray-200')} p-6`}>
            <h3 className={`font-semibold ${text('text-white', 'text-gray-900')} mb-4 flex items-center gap-2`}>
              <User className="w-5 h-5 text-purple-500" /> Représentant légal
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Nom</label>
                  <input type="text" value={organismeForm.representantNom || ''} onChange={(e) => setOrganismeForm({...organismeForm, representantNom: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
                </div>
                <div>
                  <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Prénom</label>
                  <input type="text" value={organismeForm.representantPrenom || ''} onChange={(e) => setOrganismeForm({...organismeForm, representantPrenom: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
                </div>
              </div>
              <div>
                <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Fonction</label>
                <input type="text" value={organismeForm.representantFonction || ''} onChange={(e) => setOrganismeForm({...organismeForm, representantFonction: e.target.value})}
                  className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} placeholder="Président(e)" />
              </div>
            </div>
          </div>

          {/* Contact administratif */}
          <div className={`${bg('bg-slate-800', 'bg-white')} rounded-xl border ${bg('border-slate-700', 'border-gray-200')} p-6`}>
            <h3 className={`font-semibold ${text('text-white', 'text-gray-900')} mb-4 flex items-center gap-2`}>
              <Phone className="w-5 h-5 text-orange-500" /> Contact administratif
            </h3>
            <div className="space-y-4">
              <div>
                <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Nom du contact</label>
                <input type="text" value={organismeForm.contactAdminNom || ''} onChange={(e) => setOrganismeForm({...organismeForm, contactAdminNom: e.target.value})}
                  className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Email</label>
                  <input type="email" value={organismeForm.contactAdminEmail || ''} onChange={(e) => setOrganismeForm({...organismeForm, contactAdminEmail: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
                </div>
                <div>
                  <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Téléphone</label>
                  <input type="tel" value={organismeForm.contactAdminTel || ''} onChange={(e) => setOrganismeForm({...organismeForm, contactAdminTel: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={saveOrganisme} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            <Save className="w-4 h-4" />{saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    );

    const renderOngletConvention = () => {
      const conv = convention || conventionForm;
      return (
        <div className="space-y-6">
          <div className={`${bg('bg-slate-800', 'bg-white')} rounded-xl border ${bg('border-slate-700', 'border-gray-200')} p-6`}>
            <h3 className={`font-semibold ${text('text-white', 'text-gray-900')} mb-4 flex items-center gap-2`}>
              <FileSignature className="w-5 h-5 text-blue-500" /> Convention ACI {currentYear}
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>N° Convention</label>
                  <input type="text" value={conventionForm.numeroConvention || conv?.numeroConvention || ''}
                    onChange={(e) => setConventionForm({...conventionForm, numeroConvention: e.target.value, annee: currentYear})}
                    className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
                </div>
                <div>
                  <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Date début</label>
                  <input type="date" value={conventionForm.dateDebut?.split('T')[0] || conv?.dateDebut?.split('T')[0] || ''}
                    onChange={(e) => setConventionForm({...conventionForm, dateDebut: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
                </div>
                <div>
                  <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Date fin</label>
                  <input type="date" value={conventionForm.dateFin?.split('T')[0] || conv?.dateFin?.split('T')[0] || ''}
                    onChange={(e) => setConventionForm({...conventionForm, dateFin: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Type de structure</label>
                  <select value={conventionForm.typeStructure || conv?.typeStructure || 'ACI'}
                    onChange={(e) => setConventionForm({...conventionForm, typeStructure: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`}>
                    <option value="ACI">ACI - Atelier Chantier d'Insertion</option>
                    <option value="AI">AI - Association Intermédiaire</option>
                    <option value="EI">EI - Entreprise d'Insertion</option>
                    <option value="ETTI">ETTI - Entreprise de Travail Temporaire d'Insertion</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Statut</label>
                  <select value={conventionForm.statut || conv?.statut || 'active'}
                    onChange={(e) => setConventionForm({...conventionForm, statut: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`}>
                    <option value="active">Active</option>
                    <option value="cloturee">Clôturée</option>
                    <option value="suspendue">Suspendue</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Effectifs autorisés */}
          <div className={`${bg('bg-slate-800', 'bg-white')} rounded-xl border ${bg('border-slate-700', 'border-gray-200')} p-6`}>
            <h3 className={`font-semibold ${text('text-white', 'text-gray-900')} mb-4 flex items-center gap-2`}>
              <Users className="w-5 h-5 text-green-500" /> Effectifs autorisés
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Nombre de postes ETP</label>
                <input type="number" step="0.01" value={conventionForm.effectifETPAutorise || conv?.effectifETPAutorise || ''}
                  onChange={(e) => setConventionForm({...conventionForm, effectifETPAutorise: e.target.value})}
                  className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
              </div>
              <div>
                <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Effectif physique max</label>
                <input type="number" value={conventionForm.effectifPhysique || conv?.effectifPhysique || ''}
                  onChange={(e) => setConventionForm({...conventionForm, effectifPhysique: e.target.value})}
                  className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
              </div>
            </div>
          </div>

          {/* Référent DDETS */}
          <div className={`${bg('bg-slate-800', 'bg-white')} rounded-xl border ${bg('border-slate-700', 'border-gray-200')} p-6`}>
            <h3 className={`font-semibold ${text('text-white', 'text-gray-900')} mb-4 flex items-center gap-2`}>
              <Shield className="w-5 h-5 text-purple-500" /> Référent DDETS
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Nom</label>
                <input type="text" value={conventionForm.referentDDETSNom || conv?.referentDDETSNom || ''}
                  onChange={(e) => setConventionForm({...conventionForm, referentDDETSNom: e.target.value})}
                  className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
              </div>
              <div>
                <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Email</label>
                <input type="email" value={conventionForm.referentDDETSEmail || conv?.referentDDETSEmail || ''}
                  onChange={(e) => setConventionForm({...conventionForm, referentDDETSEmail: e.target.value})}
                  className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
              </div>
              <div>
                <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Téléphone</label>
                <input type="tel" value={conventionForm.referentDDETSTel || conv?.referentDDETSTel || ''}
                  onChange={(e) => setConventionForm({...conventionForm, referentDDETSTel: e.target.value})}
                  className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={saveConvention} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              <Save className="w-4 h-4" />{saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      );
    };

    const renderOngletFinancement = () => {
      const conv = convention || conventionForm;
      const etpAutorise = parseFloat(conv?.effectifETPAutorise || conventionForm.effectifETPAutorise) || 0;
      const aideUnitaire = parseFloat(conv?.aidePosteUnitaire || conventionForm.aidePosteUnitaire) || 0;
      const aideTotale = etpAutorise * aideUnitaire;

      return (
        <div className="space-y-6">
          {/* Aide au poste */}
          <div className={`${bg('bg-slate-800', 'bg-white')} rounded-xl border ${bg('border-slate-700', 'border-gray-200')} p-6`}>
            <h3 className={`font-semibold ${text('text-white', 'text-gray-900')} mb-4 flex items-center gap-2`}>
              <Euro className="w-5 h-5 text-yellow-500" /> Aide au poste d'insertion
            </h3>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Montant annuel par ETP</label>
                <input type="number" step="0.01" value={conventionForm.aidePosteUnitaire || conv?.aidePosteUnitaire || 23921}
                  onChange={(e) => setConventionForm({...conventionForm, aidePosteUnitaire: e.target.value})}
                  className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
              </div>
              <div>
                <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Nombre ETP</label>
                <div className={`px-3 py-2 rounded-lg ${bg('bg-slate-700', 'bg-gray-100')} font-medium`}>
                  {etpAutorise.toFixed(2)}
                </div>
              </div>
              <div>
                <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Total aide au poste</label>
                <div className={`px-3 py-2 rounded-lg bg-green-500/20 text-green-400 font-bold text-lg`}>
                  {formatMontant(aideTotale)}
                </div>
              </div>
            </div>
          </div>

          {/* Autres financements */}
          <div className={`${bg('bg-slate-800', 'bg-white')} rounded-xl border ${bg('border-slate-700', 'border-gray-200')} p-6`}>
            <h3 className={`font-semibold ${text('text-white', 'text-gray-900')} mb-4 flex items-center gap-2`}>
              <Banknote className="w-5 h-5 text-green-500" /> Autres financements
            </h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Aide Région</label>
                <input type="number" step="0.01" value={conventionForm.aideRegion || conv?.aideRegion || ''}
                  onChange={(e) => setConventionForm({...conventionForm, aideRegion: e.target.value})}
                  className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
              </div>
              <div>
                <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Aide Département</label>
                <input type="number" step="0.01" value={conventionForm.aideDepartement || conv?.aideDepartement || ''}
                  onChange={(e) => setConventionForm({...conventionForm, aideDepartement: e.target.value})}
                  className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
              </div>
              <div>
                <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Aide Commune</label>
                <input type="number" step="0.01" value={conventionForm.aideCommune || conv?.aideCommune || ''}
                  onChange={(e) => setConventionForm({...conventionForm, aideCommune: e.target.value})}
                  className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
              </div>
              <div>
                <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Autres aides</label>
                <input type="number" step="0.01" value={conventionForm.autresAides || conv?.autresAides || ''}
                  onChange={(e) => setConventionForm({...conventionForm, autresAides: e.target.value})}
                  className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
              </div>
            </div>
            <div className="mt-4">
              <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Détail autres aides</label>
              <textarea value={conventionForm.autresAidesDetail || conv?.autresAidesDetail || ''}
                onChange={(e) => setConventionForm({...conventionForm, autresAidesDetail: e.target.value})}
                rows={2} className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={saveConvention} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              <Save className="w-4 h-4" />{saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      );
    };

    const renderOngletComptable = () => {
      const conv = convention || conventionForm;
      return (
        <div className="space-y-6">
          <div className={`${bg('bg-slate-800', 'bg-white')} rounded-xl border ${bg('border-slate-700', 'border-gray-200')} p-6`}>
            <h3 className={`font-semibold ${text('text-white', 'text-gray-900')} mb-4 flex items-center gap-2`}>
              <Receipt className="w-5 h-5 text-blue-500" /> Informations comptables (N-1)
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Chiffre d'affaires</label>
                <input type="number" step="0.01" value={conventionForm.chiffreAffaires || conv?.chiffreAffaires || ''}
                  onChange={(e) => setConventionForm({...conventionForm, chiffreAffaires: e.target.value})}
                  className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
              </div>
              <div>
                <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Résultat net</label>
                <input type="number" step="0.01" value={conventionForm.resultatNet || conv?.resultatNet || ''}
                  onChange={(e) => setConventionForm({...conventionForm, resultatNet: e.target.value})}
                  className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
              </div>
              <div>
                <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Fonds associatifs</label>
                <input type="number" step="0.01" value={conventionForm.fondsAssociatifs || conv?.fondsAssociatifs || ''}
                  onChange={(e) => setConventionForm({...conventionForm, fondsAssociatifs: e.target.value})}
                  className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
              </div>
              <div>
                <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Dettes financières</label>
                <input type="number" step="0.01" value={conventionForm.dettesFinancieres || conv?.dettesFinancieres || ''}
                  onChange={(e) => setConventionForm({...conventionForm, dettesFinancieres: e.target.value})}
                  className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={saveConvention} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              <Save className="w-4 h-4" />{saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      );
    };

    const renderOngletAteliers = () => (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className={`font-semibold ${text('text-white', 'text-gray-900')}`}>Ateliers et Chantiers</h3>
          <button onClick={() => { setAtelierForm({}); setEditingAtelierId(null); setShowAtelierModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Ajouter un atelier
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {organismeData?.ateliers?.map((atelier: any) => (
            <div key={atelier.id} className={`${bg('bg-slate-800', 'bg-white')} rounded-xl border ${bg('border-slate-700', 'border-gray-200')} p-4`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className={`font-medium ${text('text-white', 'text-gray-900')}`}>{atelier.nom}</h4>
                  <p className={`text-sm ${text('text-slate-400', 'text-gray-500')}`}>{atelier.secteurActivite}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setAtelierForm(atelier); setEditingAtelierId(atelier.id); setShowAtelierModal(true); }}
                    className={`p-1.5 rounded ${bg('hover:bg-slate-700', 'hover:bg-gray-100')}`}>
                    <Edit className="w-4 h-4 text-blue-500" />
                  </button>
                  <button onClick={() => deleteAtelier(atelier.id)} className={`p-1.5 rounded ${bg('hover:bg-slate-700', 'hover:bg-gray-100')}`}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
              {atelier.codeROME && <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded">{atelier.codeROME}</span>}
              {atelier.effectifETP && <p className={`text-sm ${text('text-slate-400', 'text-gray-500')} mt-2`}>{atelier.effectifETP} ETP</p>}
            </div>
          ))}
        </div>

        {(!organismeData?.ateliers || organismeData.ateliers.length === 0) && (
          <div className={`text-center py-12 ${text('text-slate-400', 'text-gray-500')}`}>
            <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucun atelier configuré</p>
          </div>
        )}
      </div>
    );

    const renderOngletBanque = () => (
      <div className="space-y-6">
        <div className={`${bg('bg-slate-800', 'bg-white')} rounded-xl border ${bg('border-slate-700', 'border-gray-200')} p-6`}>
          <h3 className={`font-semibold ${text('text-white', 'text-gray-900')} mb-4 flex items-center gap-2`}>
            <CreditCard className="w-5 h-5 text-green-500" /> Coordonnées bancaires
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>IBAN</label>
                <input type="text" value={organismeForm.iban || ''} onChange={(e) => setOrganismeForm({...organismeForm, iban: e.target.value})}
                  className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')} font-mono`}
                  placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX" />
              </div>
              <div>
                <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>BIC</label>
                <input type="text" value={organismeForm.bic || ''} onChange={(e) => setOrganismeForm({...organismeForm, bic: e.target.value})}
                  className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')} font-mono`} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Nom de la banque</label>
                <input type="text" value={organismeForm.nomBanque || ''} onChange={(e) => setOrganismeForm({...organismeForm, nomBanque: e.target.value})}
                  className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
              </div>
              <div>
                <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Titulaire du compte</label>
                <input type="text" value={organismeForm.titulaireCompte || ''} onChange={(e) => setOrganismeForm({...organismeForm, titulaireCompte: e.target.value})}
                  className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={saveOrganisme} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            <Save className="w-4 h-4" />{saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    );

    const renderOngletReglages = () => {
      if (!objectifConfig) {
        return (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        );
      }

      const handleConfigChange = (field: string, value: any) => {
        setObjectifConfig((prev: any) => ({ ...prev, [field]: value }));
      };

      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-lg font-semibold ${text('text-white', 'text-gray-900')}`}>Réglages des Objectifs Individuels</h3>
              <p className={`text-sm ${text('text-slate-400', 'text-gray-500')}`}>Configurez la pondération des critères de progression des salariés</p>
            </div>
            <button onClick={saveObjectifConfig} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              <Save className="w-4 h-4" />{saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>

          {/* Explication */}
          <div className={`${bg('bg-blue-500/10', 'bg-blue-50')} border ${bg('border-blue-500/30', 'border-blue-200')} rounded-xl p-4`}>
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className={`font-medium ${text('text-blue-400', 'text-blue-700')}`}>Comment fonctionne le calcul de progression ?</h4>
                <p className={`text-sm ${text('text-blue-300', 'text-blue-600')} mt-1`}>
                  Chaque critère rapporte des points jusqu'à son maximum. La progression est le total des points obtenus.
                  Si "Sortie positive = 100%" est activé, un salarié avec une sortie positive atteint automatiquement 100%.
                </p>
              </div>
            </div>
          </div>

          {/* Critères automatiques */}
          <div className={`${bg('bg-slate-700/50', 'bg-gray-50')} rounded-xl p-6 space-y-6`}>
            <h4 className={`font-medium ${text('text-white', 'text-gray-900')}`}>Critères automatiques</h4>

            {/* Ancienneté */}
            <div className="grid grid-cols-3 gap-4 items-center">
              <div>
                <label className={`block text-sm font-medium ${text('text-slate-300', 'text-gray-700')}`}>Ancienneté</label>
                <p className={`text-xs ${text('text-slate-500', 'text-gray-400')}`}>Points gagnés par mois de présence</p>
              </div>
              <div>
                <label className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>Points/mois</label>
                <input type="number" value={objectifConfig.pointsParMoisAnciennete}
                  onChange={(e) => handleConfigChange('pointsParMoisAnciennete', parseInt(e.target.value) || 0)}
                  className={`w-full mt-1 px-3 py-2 rounded-lg ${bg('bg-slate-600 text-white', 'bg-white border border-gray-200')}`} />
              </div>
              <div>
                <label className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>Maximum</label>
                <input type="number" value={objectifConfig.poidsAnciennete}
                  onChange={(e) => handleConfigChange('poidsAnciennete', parseInt(e.target.value) || 0)}
                  className={`w-full mt-1 px-3 py-2 rounded-lg ${bg('bg-slate-600 text-white', 'bg-white border border-gray-200')}`} />
              </div>
            </div>

            {/* Suivis */}
            <div className="grid grid-cols-3 gap-4 items-center">
              <div>
                <label className={`block text-sm font-medium ${text('text-slate-300', 'text-gray-700')}`}>Entretiens/Suivis</label>
                <p className={`text-xs ${text('text-slate-500', 'text-gray-400')}`}>Points par entretien réalisé</p>
              </div>
              <div>
                <label className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>Points/entretien</label>
                <input type="number" value={objectifConfig.pointsParSuivi}
                  onChange={(e) => handleConfigChange('pointsParSuivi', parseInt(e.target.value) || 0)}
                  className={`w-full mt-1 px-3 py-2 rounded-lg ${bg('bg-slate-600 text-white', 'bg-white border border-gray-200')}`} />
              </div>
              <div>
                <label className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>Maximum</label>
                <input type="number" value={objectifConfig.poidsSuivis}
                  onChange={(e) => handleConfigChange('poidsSuivis', parseInt(e.target.value) || 0)}
                  className={`w-full mt-1 px-3 py-2 rounded-lg ${bg('bg-slate-600 text-white', 'bg-white border border-gray-200')}`} />
              </div>
            </div>

            {/* PMSMP */}
            <div className="grid grid-cols-3 gap-4 items-center">
              <div>
                <label className={`block text-sm font-medium ${text('text-slate-300', 'text-gray-700')}`}>PMSMP réussies</label>
                <p className={`text-xs ${text('text-slate-500', 'text-gray-400')}`}>Points par PMSMP avec bilan positif</p>
              </div>
              <div>
                <label className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>Points/PMSMP</label>
                <input type="number" value={objectifConfig.pointsParPMSMP}
                  onChange={(e) => handleConfigChange('pointsParPMSMP', parseInt(e.target.value) || 0)}
                  className={`w-full mt-1 px-3 py-2 rounded-lg ${bg('bg-slate-600 text-white', 'bg-white border border-gray-200')}`} />
              </div>
              <div>
                <label className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>Maximum</label>
                <input type="number" value={objectifConfig.poidsPMSMP}
                  onChange={(e) => handleConfigChange('poidsPMSMP', parseInt(e.target.value) || 0)}
                  className={`w-full mt-1 px-3 py-2 rounded-lg ${bg('bg-slate-600 text-white', 'bg-white border border-gray-200')}`} />
              </div>
            </div>

            {/* Formations */}
            <div className="grid grid-cols-3 gap-4 items-center">
              <div>
                <label className={`block text-sm font-medium ${text('text-slate-300', 'text-gray-700')}`}>Formations validées</label>
                <p className={`text-xs ${text('text-slate-500', 'text-gray-400')}`}>Points par formation</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>Simple</label>
                  <input type="number" value={objectifConfig.pointsFormationSimple}
                    onChange={(e) => handleConfigChange('pointsFormationSimple', parseInt(e.target.value) || 0)}
                    className={`w-full mt-1 px-3 py-2 rounded-lg ${bg('bg-slate-600 text-white', 'bg-white border border-gray-200')}`} />
                </div>
                <div>
                  <label className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>Qualifiante</label>
                  <input type="number" value={objectifConfig.pointsFormationQualif}
                    onChange={(e) => handleConfigChange('pointsFormationQualif', parseInt(e.target.value) || 0)}
                    className={`w-full mt-1 px-3 py-2 rounded-lg ${bg('bg-slate-600 text-white', 'bg-white border border-gray-200')}`} />
                </div>
              </div>
              <div>
                <label className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>Maximum</label>
                <input type="number" value={objectifConfig.poidsFormations}
                  onChange={(e) => handleConfigChange('poidsFormations', parseInt(e.target.value) || 0)}
                  className={`w-full mt-1 px-3 py-2 rounded-lg ${bg('bg-slate-600 text-white', 'bg-white border border-gray-200')}`} />
              </div>
            </div>

            {/* Objectifs individuels */}
            <div className="grid grid-cols-3 gap-4 items-center">
              <div>
                <label className={`block text-sm font-medium ${text('text-slate-300', 'text-gray-700')}`}>Objectifs individuels</label>
                <p className={`text-xs ${text('text-slate-500', 'text-gray-400')}`}>Maximum de points via objectifs manuels</p>
              </div>
              <div></div>
              <div>
                <label className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>Maximum</label>
                <input type="number" value={objectifConfig.poidsObjectifsIndiv}
                  onChange={(e) => handleConfigChange('poidsObjectifsIndiv', parseInt(e.target.value) || 0)}
                  className={`w-full mt-1 px-3 py-2 rounded-lg ${bg('bg-slate-600 text-white', 'bg-white border border-gray-200')}`} />
              </div>
            </div>
          </div>

          {/* Seuils et options */}
          <div className={`${bg('bg-slate-700/50', 'bg-gray-50')} rounded-xl p-6`}>
            <h4 className={`font-medium ${text('text-white', 'text-gray-900')} mb-4`}>Seuils et options</h4>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-medium ${text('text-slate-300', 'text-gray-700')} mb-2`}>Progression max avant sortie</label>
                <div className="flex items-center gap-2">
                  <input type="number" value={objectifConfig.seuilProgressionMax}
                    onChange={(e) => handleConfigChange('seuilProgressionMax', parseInt(e.target.value) || 0)}
                    className={`w-24 px-3 py-2 rounded-lg ${bg('bg-slate-600 text-white', 'bg-white border border-gray-200')}`} />
                  <span className={text('text-slate-400', 'text-gray-500')}>%</span>
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium ${text('text-slate-300', 'text-gray-700')} mb-2`}>Sortie positive = 100%</label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={objectifConfig.sortiePositiveAuto100}
                    onChange={(e) => handleConfigChange('sortiePositiveAuto100', e.target.checked)}
                    className="w-5 h-5 rounded" />
                  <span className={text('text-slate-300', 'text-gray-600')}>Activer</span>
                </label>
              </div>
            </div>
          </div>

          {/* Récapitulatif */}
          <div className={`${bg('bg-slate-700/50', 'bg-gray-50')} rounded-xl p-6`}>
            <h4 className={`font-medium ${text('text-white', 'text-gray-900')} mb-4`}>Récapitulatif des points</h4>
            <div className="grid grid-cols-5 gap-4">
              <div className={`text-center p-3 rounded-lg ${bg('bg-slate-600', 'bg-white')}`}>
                <div className={`text-2xl font-bold ${text('text-white', 'text-gray-900')}`}>{objectifConfig.poidsAnciennete}</div>
                <div className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>Ancienneté</div>
              </div>
              <div className={`text-center p-3 rounded-lg ${bg('bg-slate-600', 'bg-white')}`}>
                <div className={`text-2xl font-bold ${text('text-white', 'text-gray-900')}`}>{objectifConfig.poidsSuivis}</div>
                <div className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>Suivis</div>
              </div>
              <div className={`text-center p-3 rounded-lg ${bg('bg-slate-600', 'bg-white')}`}>
                <div className={`text-2xl font-bold ${text('text-white', 'text-gray-900')}`}>{objectifConfig.poidsPMSMP}</div>
                <div className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>PMSMP</div>
              </div>
              <div className={`text-center p-3 rounded-lg ${bg('bg-slate-600', 'bg-white')}`}>
                <div className={`text-2xl font-bold ${text('text-white', 'text-gray-900')}`}>{objectifConfig.poidsFormations}</div>
                <div className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>Formations</div>
              </div>
              <div className={`text-center p-3 rounded-lg ${bg('bg-slate-600', 'bg-white')}`}>
                <div className={`text-2xl font-bold ${text('text-white', 'text-gray-900')}`}>{objectifConfig.poidsObjectifsIndiv}</div>
                <div className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>Obj. indiv.</div>
              </div>
            </div>
            <div className={`mt-4 pt-4 border-t ${bg('border-slate-600', 'border-gray-200')} flex justify-between items-center`}>
              <span className={text('text-slate-400', 'text-gray-500')}>Total possible (hors sortie positive)</span>
              <span className={`text-xl font-bold ${text('text-white', 'text-gray-900')}`}>
                {objectifConfig.poidsAnciennete + objectifConfig.poidsSuivis + objectifConfig.poidsPMSMP + objectifConfig.poidsFormations + objectifConfig.poidsObjectifsIndiv} pts
                {' '}(plafonné à {objectifConfig.seuilProgressionMax}%)
              </span>
            </div>
          </div>
        </div>
      );
    };

    const renderOngletObjectifs = () => {
      const obj = objectifsNegocies || objectifsNegociesForm;
      const suivis = objectifsNegocies?.suivis || [];

      return (
        <div className="space-y-6">
          {/* Header avec stats temps réel */}
          {stats && (
            <div className="grid grid-cols-5 gap-4">
              <div className={`${bg('bg-slate-800', 'bg-white')} rounded-xl border ${bg('border-slate-700', 'border-gray-200')} p-4 text-center`}>
                <div className="text-3xl font-bold text-blue-500">{stats.effectifActif}</div>
                <div className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>Effectif actuel</div>
              </div>
              <div className={`${bg('bg-slate-800', 'bg-white')} rounded-xl border ${bg('border-slate-700', 'border-gray-200')} p-4 text-center`}>
                <div className="text-3xl font-bold text-purple-500">{stats.totalSorties}</div>
                <div className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>Sorties {currentYear}</div>
              </div>
              <div className={`${bg('bg-slate-800', 'bg-white')} rounded-xl border ${bg('border-slate-700', 'border-gray-200')} p-4 text-center`}>
                <div className="text-3xl font-bold text-green-500">{stats.sortiesPositives}</div>
                <div className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>Sorties positives</div>
              </div>
              <div className={`${bg('bg-slate-800', 'bg-white')} rounded-xl border ${bg('border-slate-700', 'border-gray-200')} p-4 text-center`}>
                <div className="text-3xl font-bold text-green-500">{stats.sortiesEmploiDurable}</div>
                <div className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>Emploi durable</div>
              </div>
              <div className={`${bg('bg-slate-800', 'bg-white')} rounded-xl border ${bg('border-slate-700', 'border-gray-200')} p-4 text-center`}>
                <div className={`text-3xl font-bold ${stats.progression >= 80 ? 'text-green-500' : stats.progression >= 50 ? 'text-orange-500' : 'text-red-500'}`}>
                  {stats.progression}%
                </div>
                <div className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>Progression sorties</div>
              </div>
            </div>
          )}

          {/* Objectifs cibles */}
          <div className={`${bg('bg-slate-800', 'bg-white')} rounded-xl border ${bg('border-slate-700', 'border-gray-200')} p-6`}>
            <h3 className={`font-semibold ${text('text-white', 'text-gray-900')} mb-4 flex items-center gap-2`}>
              <Target className="w-5 h-5 text-red-500" /> Objectifs Négociés {currentYear}
            </h3>
            <div className="grid grid-cols-5 gap-4">
              <div>
                <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Sorties prévisionnelles</label>
                <input type="number" value={objectifsNegociesForm.nombreSortiesPrevisionnel || obj?.nombreSortiesPrevisionnel || ''}
                  onChange={(e) => setObjectifsNegociesForm({...objectifsNegociesForm, annee: currentYear, nombreSortiesPrevisionnel: e.target.value})}
                  className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
              </div>
              <div>
                <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Taux sorties dynamiques</label>
                <div className="flex items-center gap-1">
                  <input type="number" step="0.01" value={objectifsNegociesForm.tauxSortiesDynamiquesCible || obj?.tauxSortiesDynamiquesCible || ''}
                    onChange={(e) => setObjectifsNegociesForm({...objectifsNegociesForm, tauxSortiesDynamiquesCible: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
                  <span className={text('text-slate-400', 'text-gray-500')}>%</span>
                </div>
              </div>
              <div>
                <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Taux emploi durable</label>
                <div className="flex items-center gap-1">
                  <input type="number" step="0.01" value={objectifsNegociesForm.tauxEmploiDurableCible || obj?.tauxEmploiDurableCible || ''}
                    onChange={(e) => setObjectifsNegociesForm({...objectifsNegociesForm, tauxEmploiDurableCible: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
                  <span className={text('text-slate-400', 'text-gray-500')}>%</span>
                </div>
              </div>
              <div>
                <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Taux emploi transition</label>
                <div className="flex items-center gap-1">
                  <input type="number" step="0.01" value={objectifsNegociesForm.tauxEmploiTransitionCible || obj?.tauxEmploiTransitionCible || ''}
                    onChange={(e) => setObjectifsNegociesForm({...objectifsNegociesForm, tauxEmploiTransitionCible: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
                  <span className={text('text-slate-400', 'text-gray-500')}>%</span>
                </div>
              </div>
              <div>
                <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Taux sorties positives</label>
                <div className="flex items-center gap-1">
                  <input type="number" step="0.01" value={objectifsNegociesForm.tauxSortiesPositivesCible || obj?.tauxSortiesPositivesCible || ''}
                    onChange={(e) => setObjectifsNegociesForm({...objectifsNegociesForm, tauxSortiesPositivesCible: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
                  <span className={text('text-slate-400', 'text-gray-500')}>%</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={saveObjectifsNegocies} disabled={saving || !organismeData?.id}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                <Save className="w-4 h-4" />{saving ? 'Enregistrement...' : 'Enregistrer objectifs'}
              </button>
            </div>
          </div>

          {/* Tableau de comparaison Objectifs vs Réalisé */}
          {stats && objectifsNegocies && (
            <div className={`${bg('bg-slate-800', 'bg-white')} rounded-xl border ${bg('border-slate-700', 'border-gray-200')} overflow-hidden`}>
              <div className={`px-6 py-4 border-b ${bg('border-slate-700', 'border-gray-200')} flex items-center justify-between`}>
                <h3 className={`font-semibold ${text('text-white', 'text-gray-900')}`}>Comparaison Objectifs vs Réalisé</h3>
                <button onClick={() => { setSuiviObjectifForm({ mois: new Date().getMonth() + 1, annee: currentYear }); setShowSuiviObjectifModal(true); }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                  <Plus className="w-4 h-4" /> Ajouter suivi mensuel
                </button>
              </div>
              <table className="w-full">
                <thead>
                  <tr className={`text-left text-xs ${text('text-slate-400', 'text-gray-500')} border-b ${bg('border-slate-700', 'border-gray-200')}`}>
                    <th className="px-6 py-3">Indicateur</th>
                    <th className="px-6 py-3 text-center">Objectif</th>
                    <th className="px-6 py-3 text-center">Réalisé</th>
                    <th className="px-6 py-3 text-center">Écart</th>
                    <th className="px-6 py-3 text-center">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className={`border-b ${bg('border-slate-700/50', 'border-gray-100')}`}>
                    <td className="px-6 py-4 font-medium">Nombre de sorties</td>
                    <td className="px-6 py-4 text-center">{objectifsNegocies.nombreSortiesPrevisionnel}</td>
                    <td className="px-6 py-4 text-center font-bold">{stats.totalSorties}</td>
                    <td className={`px-6 py-4 text-center font-bold ${stats.totalSorties >= objectifsNegocies.nombreSortiesPrevisionnel ? 'text-green-500' : 'text-orange-500'}`}>
                      {stats.totalSorties - objectifsNegocies.nombreSortiesPrevisionnel}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {stats.totalSorties >= objectifsNegocies.nombreSortiesPrevisionnel
                        ? <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                        : <AlertCircle className="w-5 h-5 text-orange-500 mx-auto" />}
                    </td>
                  </tr>
                  <tr className={`border-b ${bg('border-slate-700/50', 'border-gray-100')}`}>
                    <td className="px-6 py-4 font-medium">Taux sorties dynamiques</td>
                    <td className="px-6 py-4 text-center">{formatPourcent(objectifsNegocies.tauxSortiesDynamiquesCible)}</td>
                    <td className="px-6 py-4 text-center font-bold">{formatPourcent(stats.tauxReels.sortiesDynamiques)}</td>
                    <td className={`px-6 py-4 text-center font-bold ${getEcartColor(stats.ecarts?.dynamiques || 0)}`}>
                      {stats.ecarts?.dynamiques >= 0 ? '+' : ''}{stats.ecarts?.dynamiques?.toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 text-center">
                      {stats.ecarts?.dynamiques >= 0
                        ? <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                        : <AlertCircle className="w-5 h-5 text-orange-500 mx-auto" />}
                    </td>
                  </tr>
                  <tr className={`border-b ${bg('border-slate-700/50', 'border-gray-100')}`}>
                    <td className="px-6 py-4 font-medium">Taux emploi durable</td>
                    <td className="px-6 py-4 text-center">{formatPourcent(objectifsNegocies.tauxEmploiDurableCible)}</td>
                    <td className="px-6 py-4 text-center font-bold">{formatPourcent(stats.tauxReels.emploiDurable)}</td>
                    <td className={`px-6 py-4 text-center font-bold ${getEcartColor(stats.ecarts?.emploiDurable || 0)}`}>
                      {stats.ecarts?.emploiDurable >= 0 ? '+' : ''}{stats.ecarts?.emploiDurable?.toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 text-center">
                      {stats.ecarts?.emploiDurable >= 0
                        ? <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                        : <AlertCircle className="w-5 h-5 text-orange-500 mx-auto" />}
                    </td>
                  </tr>
                  <tr className={`border-b ${bg('border-slate-700/50', 'border-gray-100')}`}>
                    <td className="px-6 py-4 font-medium">Taux emploi transition</td>
                    <td className="px-6 py-4 text-center">{formatPourcent(objectifsNegocies.tauxEmploiTransitionCible)}</td>
                    <td className="px-6 py-4 text-center font-bold">{formatPourcent(stats.tauxReels.emploiTransition)}</td>
                    <td className={`px-6 py-4 text-center font-bold ${getEcartColor(stats.ecarts?.emploiTransition || 0)}`}>
                      {stats.ecarts?.emploiTransition >= 0 ? '+' : ''}{stats.ecarts?.emploiTransition?.toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 text-center">
                      {stats.ecarts?.emploiTransition >= 0
                        ? <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                        : <AlertCircle className="w-5 h-5 text-orange-500 mx-auto" />}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium">Taux sorties positives</td>
                    <td className="px-6 py-4 text-center">{formatPourcent(objectifsNegocies.tauxSortiesPositivesCible)}</td>
                    <td className="px-6 py-4 text-center font-bold">{formatPourcent(stats.tauxReels.sortiesPositives)}</td>
                    <td className={`px-6 py-4 text-center font-bold ${getEcartColor(stats.ecarts?.sortiesPositives || 0)}`}>
                      {stats.ecarts?.sortiesPositives >= 0 ? '+' : ''}{stats.ecarts?.sortiesPositives?.toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 text-center">
                      {stats.ecarts?.sortiesPositives >= 0
                        ? <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                        : <AlertCircle className="w-5 h-5 text-orange-500 mx-auto" />}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Historique des suivis */}
          {suivis.length > 0 && (
            <div className={`${bg('bg-slate-800', 'bg-white')} rounded-xl border ${bg('border-slate-700', 'border-gray-200')} overflow-hidden`}>
              <div className={`px-6 py-4 border-b ${bg('border-slate-700', 'border-gray-200')}`}>
                <h3 className={`font-semibold ${text('text-white', 'text-gray-900')}`}>Historique des suivis mensuels</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className={`text-left text-xs ${text('text-slate-400', 'text-gray-500')} border-b ${bg('border-slate-700', 'border-gray-200')}`}>
                    <th className="px-4 py-3">Mois</th>
                    <th className="px-4 py-3 text-center">Entrées</th>
                    <th className="px-4 py-3 text-center">Sorties</th>
                    <th className="px-4 py-3 text-center">Durable</th>
                    <th className="px-4 py-3 text-center">Transition</th>
                    <th className="px-4 py-3 text-center">Formation</th>
                    <th className="px-4 py-3 text-center">Taux dyn.</th>
                  </tr>
                </thead>
                <tbody>
                  {suivis.map((s: any) => (
                    <tr key={s.id} className={`border-b ${bg('border-slate-700/50', 'border-gray-100')}`}>
                      <td className="px-4 py-3 font-medium">{moisNoms[s.mois]} {s.annee}</td>
                      <td className="px-4 py-3 text-center">{s.effectifEntree}</td>
                      <td className="px-4 py-3 text-center">{s.totalSorties}</td>
                      <td className="px-4 py-3 text-center text-green-500">{s.sortiesEmploiDurable}</td>
                      <td className="px-4 py-3 text-center text-blue-500">{s.sortiesEmploiTransition}</td>
                      <td className="px-4 py-3 text-center text-purple-500">{s.sortiesFormation}</td>
                      <td className={`px-4 py-3 text-center font-bold ${s.tauxSortiesDynamiques >= objectifsNegocies?.tauxSortiesDynamiquesCible ? 'text-green-500' : 'text-orange-500'}`}>
                        {s.tauxSortiesDynamiques?.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!objectifsNegocies && !convention && (
            <div className={`text-center py-12 ${text('text-slate-400', 'text-gray-500')}`}>
              <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Veuillez d'abord configurer une convention pour définir les objectifs négociés</p>
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-bold ${text('text-white', 'text-gray-900')}`}>Organisme</h1>
            <p className={`text-sm ${text('text-slate-400', 'text-gray-500')}`}>
              {organismeData?.raisonSociale || 'Configuration de votre structure d\'insertion'}
            </p>
          </div>
          {organismeData && (
            <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
              {organismeData.conventions?.[0]?.typeStructure || 'ACI'}
            </span>
          )}
        </div>

        {/* Onglets */}
        <div className={`${bg('bg-slate-800', 'bg-white')} rounded-xl border ${bg('border-slate-700', 'border-gray-200')}`}>
          <div className="flex overflow-x-auto border-b border-slate-700/50">
            {[
              { id: 'info', label: 'Identité', icon: Building },
              { id: 'convention', label: 'Convention', icon: FileSignature },
              { id: 'financement', label: 'Financement', icon: Euro },
              { id: 'comptable', label: 'Comptable', icon: Receipt },
              { id: 'ateliers', label: 'Ateliers', icon: Briefcase },
              { id: 'objectifs', label: 'Objectifs Négociés', icon: Target },
              { id: 'banque', label: 'Banque', icon: CreditCard },
              { id: 'reglages', label: 'Réglages', icon: Settings },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setOrganismeTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  organismeTab === tab.id
                    ? 'border-blue-500 text-blue-500'
                    : `border-transparent ${text('text-slate-400 hover:text-white', 'text-gray-500 hover:text-gray-900')}`
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {organismeTab === 'info' && renderOngletInfo()}
            {organismeTab === 'convention' && renderOngletConvention()}
            {organismeTab === 'financement' && renderOngletFinancement()}
            {organismeTab === 'comptable' && renderOngletComptable()}
            {organismeTab === 'ateliers' && renderOngletAteliers()}
            {organismeTab === 'objectifs' && renderOngletObjectifs()}
            {organismeTab === 'banque' && renderOngletBanque()}
            {organismeTab === 'reglages' && renderOngletReglages()}
          </div>
        </div>

        {/* Modal Atelier */}
        {showAtelierModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className={`${bg('bg-slate-800', 'bg-white')} rounded-xl max-w-lg w-full`}>
              <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
                <h2 className={`text-lg font-bold ${text('text-white', 'text-gray-900')}`}>
                  {editingAtelierId ? 'Modifier l\'atelier' : 'Nouvel atelier'}
                </h2>
                <button onClick={() => setShowAtelierModal(false)}><X className="w-5 h-5" /></button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Nom de l'atelier</label>
                  <input type="text" value={atelierForm.nom || ''} onChange={(e) => setAtelierForm({...atelierForm, nom: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Secteur d'activité</label>
                    <input type="text" value={atelierForm.secteurActivite || ''} onChange={(e) => setAtelierForm({...atelierForm, secteurActivite: e.target.value})}
                      className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} placeholder="Recyclage, Espaces verts..." />
                  </div>
                  <div>
                    <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Code ROME</label>
                    <input type="text" value={atelierForm.codeROME || ''} onChange={(e) => setAtelierForm({...atelierForm, codeROME: e.target.value})}
                      className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Effectif ETP</label>
                    <input type="number" step="0.01" value={atelierForm.effectifETP || ''} onChange={(e) => setAtelierForm({...atelierForm, effectifETP: e.target.value})}
                      className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
                  </div>
                  <div>
                    <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Nb encadrants</label>
                    <input type="number" value={atelierForm.effectifEncadrants || ''} onChange={(e) => setAtelierForm({...atelierForm, effectifEncadrants: e.target.value})}
                      className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
                  </div>
                </div>
                <div>
                  <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Description</label>
                  <textarea value={atelierForm.description || ''} onChange={(e) => setAtelierForm({...atelierForm, description: e.target.value})}
                    rows={2} className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
                </div>
              </div>
              <div className="p-4 border-t border-slate-700/50 flex justify-end gap-3">
                <button onClick={() => setShowAtelierModal(false)} className={`px-4 py-2 rounded-lg ${bg('bg-slate-700', 'bg-gray-200')}`}>Annuler</button>
                <button onClick={saveAtelier} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg">{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Suivi Objectif */}
        {showSuiviObjectifModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className={`${bg('bg-slate-800', 'bg-white')} rounded-xl max-w-2xl w-full`}>
              <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
                <h2 className={`text-lg font-bold ${text('text-white', 'text-gray-900')}`}>Suivi mensuel des objectifs</h2>
                <button onClick={() => setShowSuiviObjectifModal(false)}><X className="w-5 h-5" /></button>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Mois</label>
                    <select value={suiviObjectifForm.mois || ''} onChange={(e) => setSuiviObjectifForm({...suiviObjectifForm, mois: e.target.value})}
                      className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`}>
                      {moisNoms.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Année</label>
                    <input type="number" value={suiviObjectifForm.annee || currentYear} onChange={(e) => setSuiviObjectifForm({...suiviObjectifForm, annee: e.target.value})}
                      className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Entrées du mois</label>
                    <input type="number" value={suiviObjectifForm.effectifEntree || ''} onChange={(e) => setSuiviObjectifForm({...suiviObjectifForm, effectifEntree: e.target.value})}
                      className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
                  </div>
                  <div>
                    <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Sorties du mois</label>
                    <input type="number" value={suiviObjectifForm.effectifSortie || ''} onChange={(e) => setSuiviObjectifForm({...suiviObjectifForm, effectifSortie: e.target.value})}
                      className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
                  </div>
                  <div>
                    <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Effectif présent</label>
                    <input type="number" value={suiviObjectifForm.effectifPresent || ''} onChange={(e) => setSuiviObjectifForm({...suiviObjectifForm, effectifPresent: e.target.value})}
                      className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
                  </div>
                </div>
                <div className={`border-t ${bg('border-slate-700', 'border-gray-200')} pt-4`}>
                  <h4 className={`text-sm font-medium ${text('text-white', 'text-gray-900')} mb-3`}>Détail des sorties (cumulées depuis début d'année)</h4>
                  <div className="grid grid-cols-5 gap-4">
                    <div>
                      <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Emploi durable</label>
                      <input type="number" value={suiviObjectifForm.sortiesEmploiDurable || ''} onChange={(e) => setSuiviObjectifForm({...suiviObjectifForm, sortiesEmploiDurable: e.target.value})}
                        className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
                    </div>
                    <div>
                      <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Emploi transition</label>
                      <input type="number" value={suiviObjectifForm.sortiesEmploiTransition || ''} onChange={(e) => setSuiviObjectifForm({...suiviObjectifForm, sortiesEmploiTransition: e.target.value})}
                        className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
                    </div>
                    <div>
                      <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Formation</label>
                      <input type="number" value={suiviObjectifForm.sortiesFormation || ''} onChange={(e) => setSuiviObjectifForm({...suiviObjectifForm, sortiesFormation: e.target.value})}
                        className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
                    </div>
                    <div>
                      <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Autres positives</label>
                      <input type="number" value={suiviObjectifForm.sortiesAutresPositives || ''} onChange={(e) => setSuiviObjectifForm({...suiviObjectifForm, sortiesAutresPositives: e.target.value})}
                        className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
                    </div>
                    <div>
                      <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Négatives</label>
                      <input type="number" value={suiviObjectifForm.sortiesNegatives || ''} onChange={(e) => setSuiviObjectifForm({...suiviObjectifForm, sortiesNegatives: e.target.value})}
                        className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
                    </div>
                  </div>
                </div>
                <div>
                  <label className={`block text-xs ${text('text-slate-400', 'text-gray-500')} mb-1`}>Commentaire</label>
                  <textarea value={suiviObjectifForm.commentaire || ''} onChange={(e) => setSuiviObjectifForm({...suiviObjectifForm, commentaire: e.target.value})}
                    rows={2} className={`w-full px-3 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
                </div>
              </div>
              <div className="p-4 border-t border-slate-700/50 flex justify-end gap-3">
                <button onClick={() => setShowSuiviObjectifModal(false)} className={`px-4 py-2 rounded-lg ${bg('bg-slate-700', 'bg-gray-200')}`}>Annuler</button>
                <button onClick={saveSuiviObjectif} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg">{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // =================== POINTAGES ===================

  const renderPointages = () => {
    const moisNoms = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

    const changerMois = (delta: number) => {
      let newMois = pointagesMois + delta;
      let newAnnee = pointagesAnnee;
      if (newMois < 1) { newMois = 12; newAnnee--; }
      if (newMois > 12) { newMois = 1; newAnnee++; }
      setPointagesMois(newMois);
      setPointagesAnnee(newAnnee);
    };

    const getPourcentageColor = (p: number) => {
      if (p >= 98 && p <= 103) return 'text-green-500 bg-green-500/20';
      if (p < 98) return 'text-orange-500 bg-orange-500/20';
      return 'text-blue-500 bg-blue-500/20';
    };

    const handlePointageChange = (employeeId: string, dateStr: string, value: string) => {
      const heures = parseFloat(value) || 0;
      setPointageValues(prev => ({
        ...prev,
        [employeeId]: { ...prev[employeeId], [dateStr]: heures }
      }));
    };

    const handlePointageBlur = (employeeId: string, pointageMensuelId: string, dateStr: string) => {
      const heures = pointageValues[employeeId]?.[dateStr] || 0;
      savePointageValue(employeeId, pointageMensuelId, dateStr, heures);
    };

    // Appliquer heures standard pour une journée (dureeHebdo / 5)
    const appliquerHeuresStandard = async (employeeId: string, pointageMensuelId: string, dureeHebdo: number, dates: string[]) => {
      const heuresParJour = Math.round(dureeHebdo / 5 * 100) / 100;
      const pointages = dates.map(date => ({ date, heures: heuresParJour }));
      try {
        await authFetch(`${POINTAGE_API}/journalier/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pointageMensuelId, pointages })
        });
        loadPointages();
      } catch (error) {
        console.error('Erreur:', error);
      }
    };

    // Générer la feuille d'émargement PDF
    const genererFeuilleEmargement = (semaine: number = 1) => {
      if (!pointagesData) return;

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'A4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Couleur header (bleu-gris du modèle)
      const headerColor: [number, number, number] = [88, 129, 140];

      // Titre
      doc.setFontSize(22);
      doc.setTextColor(88, 129, 140);
      doc.setFont('helvetica', 'bold');
      doc.text("FEUILLE D'ÉMARGEMENT", pageWidth / 2, 20, { align: 'center' });

      // Sous-titre
      doc.setFontSize(14);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.text(`${moisNoms[pointagesMois]} ${pointagesAnnee} - Semaine ${semaine}`, pageWidth / 2, 28, { align: 'center' });

      // Informations
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      const org = organismeData;
      doc.text(`Intervenant : ${org?.responsable || 'Encadrant technique'}`, 14, 40);
      doc.text(`Lieu : ${org?.adresse || ''} ${org?.codePostal || ''} ${org?.ville || ''}`, 14, 46);

      // Calculer les jours ouvrés du mois pour la semaine sélectionnée
      // On regroupe les jours ouvrés par paquet de 5 (une semaine de travail)
      const joursOuvresMois: { date: Date; dateStr: string; label: string }[] = [];
      const joursSemaine = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

      // Parcourir tous les jours du mois et garder les jours ouvrés (Lun-Ven)
      const dernierJourMois = new Date(pointagesAnnee, pointagesMois, 0).getDate();
      for (let d = 1; d <= dernierJourMois; d++) {
        const jour = new Date(pointagesAnnee, pointagesMois - 1, d);
        const dayOfWeek = jour.getDay();
        // Jours ouvrés : Lundi (1) à Vendredi (5)
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          joursOuvresMois.push({
            date: jour,
            dateStr: `${pointagesAnnee}-${String(pointagesMois).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
            label: `${joursSemaine[dayOfWeek]} ${String(d).padStart(2, '0')}/${String(pointagesMois).padStart(2, '0')}`
          });
        }
      }

      // Prendre les 5 jours de la semaine sélectionnée (semaine 1 = jours 0-4, semaine 2 = jours 5-9, etc.)
      const startIndex = (semaine - 1) * 5;
      const joursOuvres = joursOuvresMois.slice(startIndex, startIndex + 5);

      // Préparer les données du tableau
      const employees = pointagesData.pointages || [];

      // En-têtes du tableau
      const headers = [
        [
          { content: 'PARTICIPANTS', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fillColor: headerColor, textColor: [255, 255, 255], fontStyle: 'bold' } },
          ...joursOuvres.map(j => ({
            content: j.label,
            colSpan: 2,
            styles: { halign: 'center', fillColor: headerColor, textColor: [255, 255, 255], fontStyle: 'bold' }
          }))
        ],
        [
          ...joursOuvres.flatMap(() => [
            { content: 'Matin\n08:00 - 12:00', styles: { halign: 'center', fillColor: headerColor, textColor: [255, 255, 255], fontSize: 7 } },
            { content: 'Après-midi\n13:00 - 16:30', styles: { halign: 'center', fillColor: headerColor, textColor: [255, 255, 255], fontSize: 7 } }
          ])
        ]
      ];

      // Données des employés
      const body = employees.map((p: any) => {
        const emp = p.employee;
        const row: any[] = [
          { content: `${emp.prenom} ${emp.nom.toUpperCase()}`, styles: { fontStyle: 'bold' } }
        ];

        joursOuvres.forEach(j => {
          const heures = pointageValues[emp.id]?.[j.dateStr] || 0;
          const dayOfWeek = j.date.getDay();
          // Lundi à Jeudi : 3h matin + 3.5h après-midi par défaut
          // Vendredi : 0h par défaut
          const isLundiAJeudi = dayOfWeek >= 1 && dayOfWeek <= 4;

          if (heures > 0) {
            // Si des heures sont pointées, on les répartit matin/après-midi
            const heureMatin = Math.min(heures, isLundiAJeudi ? 3 : 4);
            const heureAprem = Math.max(0, heures - heureMatin);
            // Cases pour signature (vides pour que l'employé signe)
            row.push({ content: '', styles: { minCellHeight: 18 } });
            row.push({ content: '', styles: { minCellHeight: 18 } });
          } else {
            // Pas de pointage
            row.push({ content: '', styles: { minCellHeight: 18, fillColor: [245, 245, 245] } });
            row.push({ content: '', styles: { minCellHeight: 18, fillColor: [245, 245, 245] } });
          }
        });

        return row;
      });

      // Ajouter des lignes vides pour atteindre minimum 10 lignes
      const minLignes = 10;
      while (body.length < minLignes) {
        const emptyRow: any[] = [{ content: '', styles: { minCellHeight: 18 } }];
        for (let i = 0; i < joursOuvres.length * 2; i++) {
          emptyRow.push({ content: '', styles: { minCellHeight: 18 } });
        }
        body.push(emptyRow);
      }

      // Générer le tableau
      autoTable(doc, {
        startY: 52,
        head: headers,
        body: body,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 3,
          lineColor: [200, 200, 200],
          lineWidth: 0.3
        },
        headStyles: {
          fillColor: headerColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 45 }
        },
        margin: { left: 14, right: 14 }
      });

      // Pied de page
      const finalY = (doc as any).lastAutoTable?.finalY || 180;
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 14, finalY + 10);

      // Télécharger le PDF
      doc.save(`Feuille_Emargement_${moisNoms[pointagesMois]}_${pointagesAnnee}_S${semaine}.pdf`);
    };

    // Calculer le nombre de semaines dans le mois (basé sur les jours ouvrés)
    const getNombreSemaines = () => {
      // Compter les jours ouvrés du mois
      const dernierJourMois = new Date(pointagesAnnee, pointagesMois, 0).getDate();
      let joursOuvres = 0;
      for (let d = 1; d <= dernierJourMois; d++) {
        const jour = new Date(pointagesAnnee, pointagesMois - 1, d);
        const dayOfWeek = jour.getDay();
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          joursOuvres++;
        }
      }
      // Nombre de semaines = nombre de jours ouvrés / 5 (arrondi supérieur)
      return Math.ceil(joursOuvres / 5);
    };

    return (
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-bold ${text('text-white', 'text-gray-900')}`}>Pointages</h1>
            <p className={`text-sm ${text('text-slate-400', 'text-gray-500')}`}>Gestion des heures travaillées</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Sélecteur de mois */}
            <div className="flex items-center gap-2">
              <button onClick={() => changerMois(-1)} className={`p-2 rounded-lg ${bg('bg-slate-700 hover:bg-slate-600', 'bg-gray-200 hover:bg-gray-300')}`}>
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className={`px-4 py-2 rounded-lg font-medium ${bg('bg-slate-800', 'bg-white')} min-w-[180px] text-center`}>
                {moisNoms[pointagesMois]} {pointagesAnnee}
              </div>
              <button onClick={() => changerMois(1)} className={`p-2 rounded-lg ${bg('bg-slate-700 hover:bg-slate-600', 'bg-gray-200 hover:bg-gray-300')}`}>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            {/* Bouton Feuille d'émargement */}
            {pointagesData && (
              <div className="flex items-center gap-2">
                <select
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
                  className={`px-3 py-2 rounded-lg text-sm ${bg('bg-slate-700 text-white', 'bg-gray-200 text-gray-900')} border-0 focus:ring-2 focus:ring-teal-500`}
                >
                  {Array.from({ length: getNombreSemaines() }, (_, i) => (
                    <option key={i + 1} value={i + 1}>Semaine {i + 1}</option>
                  ))}
                </select>
                <button
                  onClick={() => genererFeuilleEmargement(selectedWeek)}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
                >
                  <FileSignature className="w-4 h-4" />
                  Feuille d'émargement
                </button>
              </div>
            )}
          </div>
        </div>

        {pointagesLoading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : pointagesData ? (
          <>
            {/* Statistiques globales */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className={`${bg('bg-slate-800', 'bg-white')} rounded-xl p-4 border ${bg('border-slate-700', 'border-gray-200')}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>Heures contrat</p>
                    <p className={`text-2xl font-bold ${text('text-white', 'text-gray-900')}`}>{Math.round(pointagesData.totaux.heuresContrat)}h</p>
                    {(() => {
                      const diff = pointagesData.totaux.heuresPointees - pointagesData.totaux.heuresContrat;
                      const diffArrondi = Math.round(diff * 10) / 10;
                      return (
                        <p className={`text-xs font-medium ${diff >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {diff >= 0 ? '+' : ''}{diffArrondi}h
                        </p>
                      );
                    })()}
                  </div>
                  <Target className="w-8 h-8 text-blue-500/30" />
                </div>
              </div>
              <div className={`${bg('bg-slate-800', 'bg-white')} rounded-xl p-4 border ${bg('border-slate-700', 'border-gray-200')}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>Heures pointées</p>
                    <p className={`text-2xl font-bold ${text('text-white', 'text-gray-900')}`}>{Math.round(pointagesData.totaux.heuresPointees)}h</p>
                  </div>
                  <Clock className="w-8 h-8 text-green-500/30" />
                </div>
              </div>
              <div className={`${bg('bg-slate-800', 'bg-white')} rounded-xl p-4 border ${bg('border-slate-700', 'border-gray-200')}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>% Global</p>
                    <p className={`text-2xl font-bold ${getPourcentageColor(pointagesData.totaux.pourcentageGlobal).split(' ')[0]}`}>
                      {pointagesData.totaux.pourcentageGlobal}%
                    </p>
                  </div>
                  <PieChart className="w-8 h-8 text-purple-500/30" />
                </div>
              </div>
              <div className={`${bg('bg-slate-800', 'bg-white')} rounded-xl p-4 border ${bg('border-slate-700', 'border-gray-200')}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>Banque d'heures</p>
                    <p className={`text-2xl font-bold ${pointagesData.totaux.heuresBanque >= 0 ? 'text-amber-500' : 'text-red-500'}`}>
                      {pointagesData.totaux.heuresBanque >= 0 ? '' : ''}{Math.round(pointagesData.totaux.heuresBanque)}h
                    </p>
                  </div>
                  <Banknote className="w-8 h-8 text-amber-500/30" />
                </div>
              </div>
              <div className={`${bg('bg-slate-800', 'bg-white')} rounded-xl p-4 border ${bg('border-slate-700', 'border-gray-200')}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>Salariés</p>
                    <p className={`text-2xl font-bold ${text('text-white', 'text-gray-900')}`}>{pointagesData.pointages.length}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500/30" />
                </div>
              </div>
            </div>

            {/* Grille de pointage */}
            <div className={`${bg('bg-slate-800', 'bg-white')} rounded-xl border ${bg('border-slate-700', 'border-gray-200')} overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`${bg('bg-slate-700', 'bg-gray-100')}`}>
                      <th className={`sticky left-0 z-10 ${bg('bg-slate-700', 'bg-gray-100')} px-3 py-2 text-left font-medium border-r ${bg('border-slate-600', 'border-gray-200')}`}>
                        Salarié
                      </th>
                      <th className={`px-2 py-2 text-center font-medium border-r ${bg('border-slate-600', 'border-gray-200')}`}>Contrat</th>
                      {pointagesData.joursMois.map((j: any) => (
                        <th
                          key={j.date}
                          className={`px-1 py-2 text-center font-medium min-w-[40px] ${j.estWeekend ? bg('bg-slate-600/50', 'bg-gray-200') : ''}`}
                        >
                          <div className={`text-xs ${j.estWeekend ? 'text-slate-400' : ''}`}>{j.nomJour}</div>
                          <div className={`text-xs ${j.estWeekend ? 'text-slate-400' : ''}`}>{j.jour}</div>
                        </th>
                      ))}
                      <th className={`px-2 py-2 text-center font-medium border-l ${bg('border-slate-600', 'border-gray-200')}`}>Total</th>
                      <th className={`px-2 py-2 text-center font-medium`}>%</th>
                      <th className={`px-2 py-2 text-center font-medium`}>Banque</th>
                      <th className={`px-2 py-2 text-center font-medium`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pointagesData.pointages.map((p: any) => {
                      const emp = p.employee;
                      const pointage = p.pointage;
                      const heuresParJour = Math.round(emp.dureeHebdo / 5 * 100) / 100;
                      const isEditing = editingPointage === emp.id;

                      return (
                        <tr key={emp.id} className={`border-t ${bg('border-slate-700', 'border-gray-200')} ${bg('hover:bg-slate-700/30', 'hover:bg-gray-50')}`}>
                          {/* Nom salarié */}
                          <td className={`sticky left-0 z-10 ${bg('bg-slate-800', 'bg-white')} px-3 py-2 border-r ${bg('border-slate-700', 'border-gray-200')}`}>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                                <span className="text-xs font-medium text-blue-500">{emp.prenom[0]}{emp.nom[0]}</span>
                              </div>
                              <div>
                                <p className={`font-medium text-sm ${text('text-white', 'text-gray-900')}`}>{emp.prenom} {emp.nom}</p>
                                <p className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>{emp.dureeHebdo}h/sem</p>
                              </div>
                            </div>
                          </td>
                          {/* Heures contrat */}
                          <td className={`px-2 py-2 text-center border-r ${bg('border-slate-700', 'border-gray-200')}`}>
                            <span className="text-xs font-medium">{Math.round(pointage.heuresContrat)}h</span>
                          </td>
                          {/* Jours */}
                          {pointagesData.joursMois.map((j: any, jourIndex: number) => {
                            const heures = pointageValues[emp.id]?.[j.date] || 0;
                            const empIndex = pointagesData.pointages.findIndex((pt: any) => pt.employee.id === emp.id);
                            // TabIndex vertical: colonne par colonne (jour d'abord, puis employé)
                            const tabIdx = jourIndex * pointagesData.pointages.length + empIndex + 1;
                            return (
                              <td key={j.date} className={`px-0 py-1 text-center ${j.estWeekend ? bg('bg-slate-700/30', 'bg-gray-100') : ''}`}>
                                {j.estWeekend ? (
                                  <span className="text-xs text-slate-500">-</span>
                                ) : isEditing ? (
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    tabIndex={tabIdx}
                                    value={heures || ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) {
                                        handlePointageChange(emp.id, j.date, val);
                                      }
                                    }}
                                    onBlur={() => handlePointageBlur(emp.id, pointage.id, j.date)}
                                    className={`w-12 px-1 py-1 text-center text-xs rounded ${bg('bg-slate-600 text-white', 'bg-gray-100 text-gray-900')} border-0 focus:ring-1 focus:ring-blue-500`}
                                    style={{ MozAppearance: 'textfield', WebkitAppearance: 'none' }}
                                  />
                                ) : (
                                  <span className={`text-xs ${heures > 0 ? text('text-white', 'text-gray-900') : 'text-slate-500'}`}>
                                    {heures > 0 ? heures : '-'}
                                  </span>
                                )}
                              </td>
                            );
                          })}
                          {/* Total */}
                          <td className={`px-2 py-2 text-center font-medium border-l ${bg('border-slate-700', 'border-gray-200')}`}>
                            {Math.round(pointage.heuresPointees)}h
                          </td>
                          {/* Pourcentage */}
                          <td className="px-2 py-2 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${getPourcentageColor(pointage.pourcentage)}`}>
                              {pointage.pourcentage}%
                            </span>
                          </td>
                          {/* Banque */}
                          <td className="px-2 py-2 text-center">
                            <div className="flex flex-col items-center gap-0.5">
                              {pointage.statut === 'valide' ? (
                                <>
                                  <span className={`text-xs font-medium ${
                                    pointage.heuresBanqueSortie > 0 ? 'text-green-500' :
                                    pointage.heuresBanqueSortie < 0 ? 'text-red-500' : 'text-slate-500'
                                  }`}>
                                    {pointage.heuresBanqueSortie > 0 ? '+' : ''}{Math.round(pointage.heuresBanqueSortie * 10) / 10}h
                                  </span>
                                  <span className="text-[10px] text-slate-500">
                                    {pointage.heuresBanqueSortie >= 0 ? 'en banque' : 'déficit'}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className={`text-xs ${
                                    pointage.heuresBanqueEntree > 0 ? 'text-amber-500' :
                                    pointage.heuresBanqueEntree < 0 ? 'text-red-500' : 'text-slate-500'
                                  }`}>
                                    {pointage.heuresBanqueEntree > 0 ? `+${Math.round(pointage.heuresBanqueEntree * 10) / 10}h` :
                                     pointage.heuresBanqueEntree < 0 ? `${Math.round(pointage.heuresBanqueEntree * 10) / 10}h` : '0h'}
                                  </span>
                                  {pointage.heuresBanqueEntree < 0 && (
                                    <span className="text-[10px] text-red-400">déficit à rattraper</span>
                                  )}
                                  {pointage.pourcentage < 100 && pointage.heuresBanqueEntree > 0 && pointage.statut !== 'valide' && (
                                    <button
                                      onClick={() => {
                                        const heuresManquantes = Math.round((pointage.heuresContrat - pointage.heuresPointees) * 10) / 10;
                                        const aUtiliser = Math.min(heuresManquantes, pointage.heuresBanqueEntree);
                                        if (confirm(`Utiliser ${aUtiliser}h de la banque pour atteindre 100% ?`)) {
                                          utiliserBanqueHeures(pointage.id, aUtiliser);
                                        }
                                      }}
                                      className="text-xs text-blue-500 hover:underline"
                                    >
                                      Utiliser
                                    </button>
                                  )}
                                  {pointage.pourcentage > 100 && (
                                    <span className="text-[10px] text-blue-400">
                                      +{Math.round((pointage.heuresPointees - pointage.heuresContrat) * 10) / 10}h à transférer
                                    </span>
                                  )}
                                  {pointage.pourcentage < 100 && pointage.heuresBanqueEntree <= 0 && (
                                    <span className="text-[10px] text-orange-400">
                                      {Math.round((pointage.heuresContrat - pointage.heuresPointees) * 10) / 10}h manquantes
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                          {/* Actions */}
                          <td className="px-2 py-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={() => {
                                      // Appliquer heures standard sur jours ouvrés sans pointage
                                      const joursOuvresSansPointage = pointagesData.joursMois
                                        .filter((j: any) => !j.estWeekend && !(pointageValues[emp.id]?.[j.date] > 0))
                                        .map((j: any) => j.date);
                                      if (joursOuvresSansPointage.length > 0) {
                                        appliquerHeuresStandard(emp.id, pointage.id, emp.dureeHebdo, joursOuvresSansPointage);
                                      }
                                    }}
                                    className="p-1 text-green-500 hover:bg-green-500/20 rounded"
                                    title="Remplir jours vides"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setEditingPointage(null)}
                                    className="p-1 text-blue-500 hover:bg-blue-500/20 rounded"
                                    title="Terminer"
                                  >
                                    <Save className="w-4 h-4" />
                                  </button>
                                </>
                              ) : pointage.statut === 'valide' ? (
                                <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-500 font-medium">Validé</span>
                              ) : (
                                <>
                                  <button
                                    onClick={() => setEditingPointage(emp.id)}
                                    className="p-1 text-blue-500 hover:bg-blue-500/20 rounded"
                                    title="Modifier"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  {pointage.heuresPointees > 0 && (
                                    <button
                                      onClick={() => {
                                        const excedent = Math.max(0, pointage.heuresPointees - pointage.heuresContrat);
                                        validerPointageIndividuel(pointage.id, `${emp.prenom} ${emp.nom}`, excedent);
                                      }}
                                      className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                                      title="Valider et transférer vers banque"
                                    >
                                      Valider
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Légende */}
            <div className={`${bg('bg-slate-800', 'bg-white')} rounded-xl p-4 border ${bg('border-slate-700', 'border-gray-200')}`}>
              <h3 className={`font-semibold mb-3 ${text('text-white', 'text-gray-900')}`}>Légende & Aide</h3>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded-full text-xs font-bold text-green-500 bg-green-500/20">98-103%</span>
                  <span className={text('text-slate-400', 'text-gray-600')}>Objectif atteint</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded-full text-xs font-bold text-orange-500 bg-orange-500/20">&lt;98%</span>
                  <span className={text('text-slate-400', 'text-gray-600')}>Heures insuffisantes (utiliser la banque)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded-full text-xs font-bold text-blue-500 bg-blue-500/20">&gt;103%</span>
                  <span className={text('text-slate-400', 'text-gray-600')}>Heures excédentaires (vers banque)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded text-xs bg-purple-600 text-white">Valider</span>
                  <span className={text('text-slate-400', 'text-gray-600')}>Valide et transfère l'excédent vers la banque</span>
                </div>
              </div>
              <div className={`mt-3 p-3 rounded-lg ${bg('bg-slate-700/50', 'bg-gray-50')}`}>
                <p className={`text-xs ${text('text-slate-300', 'text-gray-600')}`}>
                  <strong>Fonctionnement :</strong><br/>
                  1. Cliquez sur le <Edit className="w-3 h-3 inline" /> pour saisir les heures jour par jour<br/>
                  2. Si heures &lt; 100% et banque disponible, cliquez "Utiliser" pour compléter<br/>
                  3. Cliquez <span className="px-1 py-0.5 bg-purple-600 text-white rounded text-[10px]">Valider</span> pour confirmer : les heures excédentaires sont créditées dans la banque pour le mois suivant
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className={`${bg('bg-slate-800', 'bg-white')} rounded-xl p-8 text-center border ${bg('border-slate-700', 'border-gray-200')}`}>
            <Clock className="w-12 h-12 mx-auto mb-4 text-slate-400" />
            <p className={text('text-slate-400', 'text-gray-500')}>Aucune donnée de pointage pour ce mois</p>
          </div>
        )}
      </div>
    );
  };

  // FICHE INFORMATION COMPLETE
  const renderFicheInformation = () => {
    if (!selectedEmployee) return null;
    const emp = editingEmployee ? formData : selectedEmployee;
    const handleChange = handleFormDataChange;

    return (
      <div className="space-y-6">
        {/* Actions */}
        <div className="flex justify-end gap-2">
          {editingEmployee ? (
            <>
              <button onClick={() => setEditingEmployee(false)} className={`px-4 py-2 rounded-lg ${bg('bg-slate-700', 'bg-gray-200')}`}>
                Annuler
              </button>
              <button onClick={saveEmployee} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <Save className="w-4 h-4" /> {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </>
          ) : (
            <>
              <div className="flex gap-2">
                <button onClick={() => generateFicheSalariePDF(selectedEmployee)} className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm">
                  <FileDown className="w-4 h-4" /> Fiche PDF
                </button>
                <button onClick={() => generateRapportSuiviPDF(selectedEmployee)} className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 text-sm">
                  <FileDown className="w-4 h-4" /> Rapport suivi
                </button>
                <button onClick={() => generateAttestationEmploiPDF(selectedEmployee)} className="px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center gap-2 text-sm">
                  <FileDown className="w-4 h-4" /> Attestation
                </button>
              </div>
              <button onClick={() => { setFormData(selectedEmployee); setEditingEmployee(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <Edit className="w-4 h-4" /> Modifier
              </button>
            </>
          )}
        </div>

        {/* État civil */}
        <Section title="État civil" icon={User}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input label="Civilité" name="civilite" type="select" value={emp.civilite} onChange={handleChange} disabled={!editingEmployee}
              options={[{ value: 'M.', label: 'Monsieur' }, { value: 'Mme', label: 'Madame' }]} required />
            <Input label="Nom de naissance" name="nom" value={emp.nom} onChange={handleChange} disabled={!editingEmployee} required />
            <Input label="Nom d'usage" name="nomUsage" value={emp.nomUsage} onChange={handleChange} disabled={!editingEmployee} />
            <Input label="Prénom" name="prenom" value={emp.prenom} onChange={handleChange} disabled={!editingEmployee} required />
            <Input label="Date de naissance" name="dateNaissance" type="date" value={emp.dateNaissance?.split('T')[0]} onChange={handleChange} disabled={!editingEmployee} required />
            <Input label="Lieu de naissance" name="lieuNaissance" value={emp.lieuNaissance} onChange={handleChange} disabled={!editingEmployee} />
            <Input label="Nationalité" name="nationalite" value={emp.nationalite} onChange={handleChange} disabled={!editingEmployee} />
            <Input label="N° Sécurité sociale" name="numeroSecu" value={emp.numeroSecu} onChange={handleChange} disabled={!editingEmployee} placeholder="1 XX XX XX XXX XXX XX" />
          </div>
        </Section>

        {/* Coordonnées */}
        <Section title="Coordonnées" icon={MapPin}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input label="Adresse" name="adresse" value={emp.adresse} onChange={handleChange} disabled={!editingEmployee} className="lg:col-span-2" required />
            <Input label="Code postal" name="codePostal" value={emp.codePostal} onChange={handleChange} disabled={!editingEmployee} required />
            <Input label="Ville" name="ville" value={emp.ville} onChange={handleChange} disabled={!editingEmployee} required />
            <Input label="Téléphone principal" name="telephone" type="tel" value={emp.telephone} onChange={handleChange} disabled={!editingEmployee} required />
            <Input label="Téléphone secondaire" name="telephoneSecondaire" type="tel" value={emp.telephoneSecondaire} onChange={handleChange} disabled={!editingEmployee} />
            <Input label="Email" name="email" type="email" value={emp.email} onChange={handleChange} disabled={!editingEmployee} className="lg:col-span-2" />
          </div>
        </Section>

        {/* Situation personnelle */}
        <Section title="Situation personnelle" icon={Heart}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input label="Situation familiale" name="situationFamiliale" type="select" value={emp.situationFamiliale} onChange={handleChange} disabled={!editingEmployee}
              options={[
                { value: 'celibataire', label: 'Célibataire' },
                { value: 'marie', label: 'Marié(e)' },
                { value: 'pacse', label: 'Pacsé(e)' },
                { value: 'divorce', label: 'Divorcé(e)' },
                { value: 'veuf', label: 'Veuf/Veuve' },
                { value: 'concubinage', label: 'Concubinage' }
              ]} />
            <Input label="Nombre d'enfants" name="nombreEnfants" type="number" value={emp.nombreEnfants} onChange={handleChange} disabled={!editingEmployee} />
            <div className="flex items-center gap-6 lg:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="permisConduire" checked={emp.permisConduire} onChange={handleChange} disabled={!editingEmployee} className="w-4 h-4 rounded" />
                <span className={text('text-white', 'text-gray-900')}>Permis de conduire</span>
              </label>
              {emp.permisConduire && (
                <Input label="Type(s)" name="typePermis" value={emp.typePermis} onChange={handleChange} disabled={!editingEmployee} placeholder="A, B, C..." className="flex-1" />
              )}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="vehicule" checked={emp.vehicule} onChange={handleChange} disabled={!editingEmployee} className="w-4 h-4 rounded" />
                <span className={text('text-white', 'text-gray-900')}>Véhicule personnel</span>
              </label>
            </div>
          </div>
        </Section>

        {/* Pièce d'identité */}
        <Section title="Pièce d'identité" icon={IdCard}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input label="Type de pièce" name="typePieceIdentite" type="select" value={emp.typePieceIdentite} onChange={handleChange} disabled={!editingEmployee}
              options={[
                { value: 'CNI', label: 'Carte Nationale d\'Identité' },
                { value: 'PASSEPORT', label: 'Passeport' },
                { value: 'TITRE_SEJOUR', label: 'Titre de séjour' },
                { value: 'RECEPISSE', label: 'Récépissé' }
              ]} />
            <Input label="Numéro" name="numeroPieceIdentite" value={emp.numeroPieceIdentite} onChange={handleChange} disabled={!editingEmployee} />
            <Input label="Date d'expiration" name="dateExpirationPiece" type="date" value={emp.dateExpirationPiece?.split('T')[0]} onChange={handleChange} disabled={!editingEmployee} />
          </div>
        </Section>

        {/* Situation administrative */}
        <Section title="Situation administrative" icon={Landmark}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-4 flex flex-wrap gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="inscritFranceTravail" checked={emp.inscritFranceTravail} onChange={handleChange} disabled={!editingEmployee} className="w-4 h-4 rounded" />
                <span className={text('text-white', 'text-gray-900')}>Inscrit France Travail</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="beneficiaireRSA" checked={emp.beneficiaireRSA} onChange={handleChange} disabled={!editingEmployee} className="w-4 h-4 rounded" />
                <span className={text('text-white', 'text-gray-900')}>Bénéficiaire RSA</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="beneficiaireASS" checked={emp.beneficiaireASS} onChange={handleChange} disabled={!editingEmployee} className="w-4 h-4 rounded" />
                <span className={text('text-white', 'text-gray-900')}>Bénéficiaire ASS</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="beneficiaireAAH" checked={emp.beneficiaireAAH} onChange={handleChange} disabled={!editingEmployee} className="w-4 h-4 rounded" />
                <span className={text('text-white', 'text-gray-900')}>Bénéficiaire AAH</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="reconnaissanceTH" checked={emp.reconnaissanceTH} onChange={handleChange} disabled={!editingEmployee} className="w-4 h-4 rounded" />
                <span className={text('text-white', 'text-gray-900')}>RQTH</span>
              </label>
            </div>
            {emp.inscritFranceTravail && (
              <Input label="N° France Travail" name="numeroFranceTravail" value={emp.numeroFranceTravail} onChange={handleChange} disabled={!editingEmployee} />
            )}
          </div>
        </Section>

        {/* IAE / Pass Inclusion */}
        <Section title="IAE - Pass Inclusion" icon={BadgeCheck}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input label="N° Pass Inclusion" name="passInclusionNumero" value={emp.passInclusionNumero} onChange={handleChange} disabled={!editingEmployee} />
            <Input label="Date d'émission" name="passInclusionDate" type="date" value={emp.passInclusionDate?.split('T')[0]} onChange={handleChange} disabled={!editingEmployee} />
            <Input label="Date d'expiration" name="passInclusionExpiration" type="date" value={emp.passInclusionExpiration?.split('T')[0]} onChange={handleChange} disabled={!editingEmployee} />
            <Input label="Critère d'éligibilité IAE" name="eligibiliteIAE" type="select" value={emp.eligibiliteIAE} onChange={handleChange} disabled={!editingEmployee}
              options={[
                { value: 'RSA > 12 mois', label: 'Bénéficiaire RSA depuis + de 12 mois' },
                { value: 'DELD > 24 mois', label: 'DELD > 24 mois' },
                { value: 'DELD > 12 mois', label: 'DELD > 12 mois' },
                { value: 'Jeune < 26 ans', label: 'Jeune < 26 ans en difficulté' },
                { value: 'Senior > 50 ans', label: 'Senior > 50 ans' },
                { value: 'TH', label: 'Travailleur handicapé' },
                { value: 'ASS', label: 'Bénéficiaire ASS' },
                { value: 'AAH', label: 'Bénéficiaire AAH' },
                { value: 'Sortant détention', label: 'Sortant de détention' },
                { value: 'Autre', label: 'Autre critère' }
              ]} />
          </div>
        </Section>

        {/* Contrat de travail */}
        <Section title="Contrat de travail" icon={FileSignature}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input label="Date d'entrée" name="dateEntree" type="date" value={emp.dateEntree?.split('T')[0]} onChange={handleChange} disabled={!editingEmployee} required />
            <Input label="Type de contrat" name="typeContrat" type="select" value={emp.typeContrat} onChange={handleChange} disabled={!editingEmployee}
              options={[
                { value: 'CDDI', label: 'CDDI - Contrat à Durée Déterminée d\'Insertion' },
                { value: 'CDD_INSERTION', label: 'CDD Insertion' },
                { value: 'CDI', label: 'CDI' }
              ]} required />
            <Input label="Durée hebdomadaire (h)" name="dureeHebdo" type="number" value={emp.dureeHebdo} onChange={handleChange} disabled={!editingEmployee} />
            <Input label="Poste occupé" name="poste" value={emp.poste} onChange={handleChange} disabled={!editingEmployee} />
            <Input label="Salaire brut mensuel (€)" name="salaireBrut" type="number" value={emp.salaireBrut} onChange={handleChange} disabled={!editingEmployee} />
            <Input label="Statut" name="statut" type="select" value={emp.statut} onChange={handleChange} disabled={!editingEmployee}
              options={[
                { value: 'actif', label: 'Actif' },
                { value: 'suspendu', label: 'Suspendu' },
                { value: 'sorti', label: 'Sorti' }
              ]} />
            {emp.statut === 'sorti' && (
              <>
                <Input label="Date de sortie" name="dateSortie" type="date" value={emp.dateSortie?.split('T')[0]} onChange={handleChange} disabled={!editingEmployee} />
                <Input label="Catégorie de sortie (Objectifs Négociés)" name="motifSortie" type="select" value={emp.motifSortie} onChange={handleChange} disabled={!editingEmployee}
                  options={[
                    { value: '', label: '-- Sélectionner --' },
                    { value: 'CDI', label: '🟢 Emploi durable - CDI' },
                    { value: 'CDD > 6 mois', label: '🟢 Emploi durable - CDD > 6 mois' },
                    { value: 'Création entreprise', label: '🟢 Emploi durable - Création entreprise' },
                    { value: 'CDD < 6 mois', label: '🔵 Emploi transition - CDD < 6 mois' },
                    { value: 'Intérim', label: '🔵 Emploi transition - Intérim' },
                    { value: 'Autre SIAE', label: '🔵 Emploi transition - Autre SIAE' },
                    { value: 'Formation qualifiante', label: '🟣 Formation qualifiante' },
                    { value: 'Autre positive', label: '🟡 Autre sortie positive' },
                    { value: 'Abandon', label: '🔴 Négative - Abandon' },
                    { value: 'Licenciement', label: '🔴 Négative - Licenciement' },
                    { value: 'Fin de contrat', label: '⚪ Neutre - Fin de contrat' },
                    { value: 'Autre', label: '⚪ Autre' }
                  ]} />
                <Input label="Type de sortie (auto-calculé)" name="typeSortie" type="select" value={emp.typeSortie} onChange={handleChange} disabled={!editingEmployee}
                  options={[
                    { value: 'positive', label: 'Positive' },
                    { value: 'neutre', label: 'Neutre' },
                    { value: 'negative', label: 'Négative' }
                  ]} />
              </>
            )}
          </div>
        </Section>

        {/* Notes */}
        <Section title="Notes / Observations" icon={FileText}>
          <Input name="notes" type="textarea" value={emp.notes} onChange={handleChange} disabled={!editingEmployee} placeholder="Notes libres sur le salarié..." />
        </Section>
      </div>
    );
  };

  // =================== PARCOURS VISUEL ===================
  const renderParcours = () => {
    if (parcoursLoading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        </div>
      );
    }

    if (!parcoursData) {
      return (
        <div className="flex items-center justify-center h-96">
          <p className={`${text('text-slate-400', 'text-gray-500')}`}>Chargement du parcours...</p>
        </div>
      );
    }

    const { parcours, stats, objectifs, employee } = parcoursData;

    const getEventColor = (color: string) => {
      const colors: Record<string, { bg: string; border: string; text: string; light: string }> = {
        'emerald': { bg: 'bg-emerald-500', border: 'border-emerald-500', text: 'text-emerald-500', light: 'bg-emerald-500/20' },
        'blue': { bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-500', light: 'bg-blue-500/20' },
        'purple': { bg: 'bg-purple-500', border: 'border-purple-500', text: 'text-purple-500', light: 'bg-purple-500/20' },
        'amber': { bg: 'bg-amber-500', border: 'border-amber-500', text: 'text-amber-500', light: 'bg-amber-500/20' },
        'yellow': { bg: 'bg-yellow-500', border: 'border-yellow-500', text: 'text-yellow-500', light: 'bg-yellow-500/20' },
        'green': { bg: 'bg-green-500', border: 'border-green-500', text: 'text-green-500', light: 'bg-green-500/20' },
        'red': { bg: 'bg-red-500', border: 'border-red-500', text: 'text-red-500', light: 'bg-red-500/20' },
        'teal': { bg: 'bg-teal-500', border: 'border-teal-500', text: 'text-teal-500', light: 'bg-teal-500/20' },
        'gray': { bg: 'bg-gray-500', border: 'border-gray-500', text: 'text-gray-500', light: 'bg-gray-500/20' }
      };
      return colors[color] || colors['blue'];
    };

    const getEventIcon = (category: string) => {
      const icons: Record<string, React.ReactNode> = {
        'ENTREE': <Building2 className="w-5 h-5" />,
        'DIAGNOSTIC': <ClipboardList className="w-5 h-5" />,
        'CONTRAT': <FileSignature className="w-5 h-5" />,
        'ACCOMPAGNEMENT': <Users className="w-5 h-5" />,
        'PMSMP': <Building className="w-5 h-5" />,
        'FORMATION': <GraduationCap className="w-5 h-5" />,
        'ACQUISITION': <Award className="w-5 h-5" />,
        'AVERTISSEMENT': <AlertTriangle className="w-5 h-5" />,
        'SORTIE': <Target className="w-5 h-5" />
      };
      return icons[category] || <Calendar className="w-5 h-5" />;
    };

    const formatDate = (date: string) => {
      return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const milestones = parcours.filter((e: any) => e.type === 'milestone');
    const events = parcours.filter((e: any) => e.type === 'event');

    return (
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header avec stats */}
        <div className={`p-6 border-b ${bg('border-slate-700', 'border-gray-200')}`}>
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className={`text-xl font-bold ${text('text-white', 'text-gray-900')} mb-1`}>
                Parcours de {employee.prenom} {employee.nom}
              </h2>
              {objectifs?.principal && (
                <p className={`${text('text-slate-400', 'text-gray-500')}`}>
                  <Target className="w-4 h-4 inline mr-2" />
                  Objectif : {objectifs.principal}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setParcoursData(null); loadParcours(selectedEmployee!.id); }}
                className={`p-2 rounded-lg ${bg('bg-slate-700 hover:bg-slate-600', 'bg-gray-100 hover:bg-gray-200')} transition-colors`}
                title="Rafraîchir le parcours"
              >
                <RefreshCw className={`w-5 h-5 ${parcoursLoading ? 'animate-spin' : ''}`} />
              </button>
              <div className={`px-4 py-2 rounded-lg ${bg('bg-slate-700', 'bg-gray-100')}`}>
                <span className={`text-2xl font-bold ${stats.progression >= 80 ? 'text-emerald-500' : stats.progression >= 50 ? 'text-amber-500' : 'text-blue-500'}`}>
                  {stats.progression}%
                </span>
                <span className={`text-xs block ${text('text-slate-400', 'text-gray-500')}`}>Progression</span>
              </div>
            </div>
          </div>

          {/* Barre de progression */}
          <div className="mb-6">
            <div className={`h-3 rounded-full ${bg('bg-slate-700', 'bg-gray-200')} overflow-hidden`}>
              <div
                className={`h-full rounded-full transition-all duration-1000 ${stats.progression >= 80 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : stats.progression >= 50 ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 'bg-gradient-to-r from-blue-500 to-blue-400'}`}
                style={{ width: `${stats.progression}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className={`text-xs ${text('text-slate-500', 'text-gray-400')}`}>Entrée</span>
              <span className={`text-xs ${text('text-slate-500', 'text-gray-400')}`}>Objectif atteint</span>
            </div>
          </div>

          {/* Stats rapides */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className={`${bg('bg-slate-700/50', 'bg-gray-100')} rounded-lg p-3 text-center`}>
              <div className={`text-2xl font-bold ${text('text-white', 'text-gray-900')}`}>{stats.dureeMois}</div>
              <div className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>mois de parcours</div>
            </div>
            <div className={`${bg('bg-slate-700/50', 'bg-gray-100')} rounded-lg p-3 text-center`}>
              <div className={`text-2xl font-bold text-blue-500`}>{stats.nbSuivis}</div>
              <div className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>entretiens</div>
            </div>
            <div className={`${bg('bg-slate-700/50', 'bg-gray-100')} rounded-lg p-3 text-center`}>
              <div className={`text-2xl font-bold text-purple-500`}>{stats.nbPMSMP}</div>
              <div className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>PMSMP</div>
            </div>
            <div className={`${bg('bg-slate-700/50', 'bg-gray-100')} rounded-lg p-3 text-center`}>
              <div className={`text-2xl font-bold text-green-500`}>{stats.nbFormations}</div>
              <div className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>formations</div>
            </div>
            <div className={`${bg('bg-slate-700/50', 'bg-gray-100')} rounded-lg p-3 text-center`}>
              <div className={`text-2xl font-bold text-amber-500`}>{stats.heuresFormation}h</div>
              <div className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>de formation</div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6" style={{ scrollbarWidth: 'thin', scrollbarColor: darkMode ? '#475569 transparent' : '#cbd5e1 transparent' }}>
          <div className="flex gap-6">
            {/* Timeline principale (Milestones) */}
            <div className="flex-1">
              <h3 className={`text-sm font-semibold mb-4 ${text('text-slate-400', 'text-gray-500')} uppercase tracking-wider`}>
                Jalons clés du parcours
              </h3>
              <div className="relative">
                {/* Ligne verticale */}
                <div className={`absolute left-6 top-0 bottom-0 w-0.5 ${bg('bg-slate-700', 'bg-gray-200')}`} />

                {/* Events */}
                <div className="space-y-6">
                  {milestones.map((event: any, idx: number) => {
                    const colors = getEventColor(event.color);
                    const isSelected = selectedParcoursEvent?.id === event.id;

                    return (
                      <div
                        key={event.id}
                        className={`relative pl-16 cursor-pointer transition-all ${isSelected ? 'scale-[1.02]' : 'hover:scale-[1.01]'}`}
                        onClick={() => setSelectedParcoursEvent(isSelected ? null : event)}
                      >
                        {/* Point sur la timeline */}
                        <div className={`absolute left-3 w-7 h-7 rounded-full flex items-center justify-center ${colors.bg} text-white shadow-lg ${isSelected ? 'ring-4 ring-offset-2 ring-offset-slate-800' : ''} ${colors.border}`}>
                          {getEventIcon(event.category)}
                        </div>

                        {/* Carte de l'événement */}
                        <div className={`${bg('bg-slate-700/50', 'bg-white')} rounded-xl p-4 border-l-4 ${colors.border} shadow-sm ${isSelected ? `ring-2 ${colors.border}` : ''}`}>
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <span className={`text-xs font-medium px-2 py-0.5 rounded ${colors.light} ${colors.text}`}>
                                {event.category}
                              </span>
                              <h4 className={`text-lg font-semibold ${text('text-white', 'text-gray-900')} mt-1`}>
                                {event.title}
                              </h4>
                            </div>
                            <span className={`text-sm ${text('text-slate-400', 'text-gray-500')}`}>
                              {formatDate(event.date)}
                            </span>
                          </div>
                          {event.description && (
                            <p className={`text-sm ${text('text-slate-300', 'text-gray-600')} mb-2`}>
                              {event.description}
                            </p>
                          )}
                          {event.dateEnd && (
                            <p className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>
                              <Calendar className="w-3 h-3 inline mr-1" />
                              Jusqu'au {formatDate(event.dateEnd)}
                            </p>
                          )}

                          {/* Détails (affiché si sélectionné) */}
                          {isSelected && event.details && (
                            <div className={`mt-4 pt-4 border-t ${bg('border-slate-600', 'border-gray-200')}`}>
                              <div className="grid grid-cols-2 gap-3">
                                {Object.entries(event.details).filter(([_, v]) => v && (!Array.isArray(v) || v.length > 0)).map(([key, value]) => (
                                  <div key={key}>
                                    <span className={`text-xs ${text('text-slate-500', 'text-gray-400')} capitalize`}>{key.replace(/([A-Z])/g, ' $1')}</span>
                                    <p className={`text-sm font-medium ${text('text-slate-200', 'text-gray-700')}`}>
                                      {Array.isArray(value) ? (value as string[]).join(', ') : String(value)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sidebar - Événements secondaires */}
            <div className={`w-80 ${bg('bg-slate-700/30', 'bg-gray-50')} rounded-xl p-4`}>
              <h3 className={`text-sm font-semibold mb-4 ${text('text-slate-400', 'text-gray-500')} uppercase tracking-wider`}>
                Autres événements ({events.length})
              </h3>
              <div className="space-y-3 max-h-[500px] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent hover:scrollbar-thumb-slate-500" style={{ scrollbarWidth: 'thin', scrollbarColor: darkMode ? '#475569 transparent' : '#cbd5e1 transparent' }}>
                {events.map((event: any) => {
                  const colors = getEventColor(event.color);
                  return (
                    <div
                      key={event.id}
                      className={`${bg('bg-slate-700/50 hover:bg-slate-600/50', 'bg-white hover:bg-gray-50')} rounded-lg p-3 cursor-pointer transition-colors border-l-2 ${colors.border}`}
                      onClick={() => setSelectedParcoursEvent(selectedParcoursEvent?.id === event.id ? null : event)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`${colors.text}`}>{getEventIcon(event.category)}</span>
                        <span className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>{formatDate(event.date)}</span>
                      </div>
                      <h5 className={`text-sm font-medium ${text('text-white', 'text-gray-900')}`}>{event.title}</h5>
                      {event.description && (
                        <p className={`text-xs ${text('text-slate-400', 'text-gray-500')} line-clamp-2 mt-1`}>{event.description}</p>
                      )}
                    </div>
                  );
                })}
                {events.length === 0 && (
                  <p className={`text-sm ${text('text-slate-500', 'text-gray-400')} text-center py-4`}>
                    Aucun événement secondaire
                  </p>
                )}
              </div>

              {/* Objectifs individuels */}
              <div className={`mt-6 pt-4 border-t ${bg('border-slate-600', 'border-gray-200')}`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className={`text-xs font-semibold ${text('text-slate-400', 'text-gray-500')} uppercase`}>
                    Objectifs ({objectifsIndividuels.length})
                  </h4>
                  <button
                    onClick={() => { setObjectifForm({ categorie: 'emploi', priorite: 'normale', pointsAttribues: 5 }); setEditingObjectifId(null); setShowObjectifModal(true); }}
                    className="p-1 rounded hover:bg-slate-600 transition-colors"
                    title="Ajouter un objectif"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: darkMode ? '#475569 transparent' : '#cbd5e1 transparent' }}>
                  {objectifsIndividuels.map((obj: any) => (
                    <div
                      key={obj.id}
                      className={`${bg('bg-slate-700/50', 'bg-white')} rounded-lg p-2 text-sm`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            {obj.statut === 'atteint' ? (
                              <CheckCircle className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                            ) : (
                              <Target className="w-3 h-3 text-cyan-500 flex-shrink-0" />
                            )}
                            <span className={`font-medium truncate ${obj.statut === 'atteint' ? 'line-through text-slate-500' : text('text-white', 'text-gray-900')}`}>
                              {obj.titre}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-1.5 py-0.5 rounded ${obj.statut === 'atteint' ? 'bg-emerald-500/20 text-emerald-400' : obj.statut === 'en_cours' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'}`}>
                              {obj.statut === 'atteint' ? 'Atteint' : obj.statut === 'en_cours' ? 'En cours' : obj.statut}
                            </span>
                            <span className={`text-xs ${text('text-slate-500', 'text-gray-400')}`}>{obj.pointsAttribues} pts</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => { setObjectifForm(obj); setEditingObjectifId(obj.id); setShowObjectifModal(true); }}
                            className="p-1 rounded hover:bg-slate-600"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => deleteObjectifIndividuel(obj.id)}
                            className="p-1 rounded hover:bg-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {objectifsIndividuels.length === 0 && (
                    <p className={`text-xs ${text('text-slate-500', 'text-gray-400')} text-center py-2`}>
                      Aucun objectif défini
                    </p>
                  )}
                </div>
              </div>

              {/* Légende */}
              <div className={`mt-6 pt-4 border-t ${bg('border-slate-600', 'border-gray-200')}`}>
                <h4 className={`text-xs font-semibold mb-3 ${text('text-slate-400', 'text-gray-500')} uppercase`}>Légende</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500" /><span className={text('text-slate-300', 'text-gray-600')}>Entrée/Sortie+</span></div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500" /><span className={text('text-slate-300', 'text-gray-600')}>Accompagnement</span></div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-purple-500" /><span className={text('text-slate-300', 'text-gray-600')}>PMSMP</span></div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500" /><span className={text('text-slate-300', 'text-gray-600')}>Formation</span></div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500" /><span className={text('text-slate-300', 'text-gray-600')}>Contrat</span></div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-cyan-500" /><span className={text('text-slate-300', 'text-gray-600')}>Objectif</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // DOSSIER PRO COMPLET
  const renderDossierPro = () => {
    if (!selectedEmployee) return null;
    const emp = selectedEmployee;
    const handleFicheProChange = (e: any) => {
      const { name, value, type, checked } = e.target;
      setFicheProForm((prev: any) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    return (
      <div className="space-y-6">
        {/* Fiche PRO */}
        <Section title="Fiche PRO - Diagnostic socio-professionnel" icon={Target}
          action={<button onClick={saveFichePro} disabled={saving} className="text-sm text-blue-500 hover:text-blue-400 flex items-center gap-1">
            <Save className="w-4 h-4" /> Enregistrer
          </button>}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Niveau d'étude" name="niveauEtude" type="select" value={ficheProForm.niveauEtude} onChange={handleFicheProChange}
                options={[
                  { value: 'Sans diplôme', label: 'Sans diplôme' },
                  { value: 'CFG/DNB', label: 'CFG / Brevet des collèges' },
                  { value: 'CAP/BEP', label: 'CAP / BEP' },
                  { value: 'Bac', label: 'Baccalauréat' },
                  { value: 'Bac+2', label: 'Bac+2 (BTS, DUT)' },
                  { value: 'Bac+3', label: 'Bac+3 (Licence)' },
                  { value: 'Bac+5', label: 'Bac+5 et plus' }
                ]} />
              <Input label="Diplômes obtenus" name="diplomes" value={ficheProForm.diplomes} onChange={handleFicheProChange} placeholder="Liste des diplômes..." />
            </div>
            <Input label="Expériences professionnelles" name="experiencesPro" type="textarea" value={ficheProForm.experiencesPro} onChange={handleFicheProChange} placeholder="Détail des expériences professionnelles antérieures..." />
            <Input label="Compétences clés identifiées" name="competencesCles" type="textarea" value={ficheProForm.competencesCles} onChange={handleFicheProChange} placeholder="Compétences transversales, savoir-faire, savoir-être..." />

            <h4 className={`font-medium mt-4 ${text('text-white', 'text-gray-900')}`}>Freins identifiés</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { name: 'freinsMobilite', label: 'Mobilité', icon: Car },
                { name: 'freinsLogement', label: 'Logement', icon: Building },
                { name: 'freinsSante', label: 'Santé', icon: Heart },
                { name: 'freinsGardeEnfants', label: 'Garde enfants', icon: Baby },
                { name: 'freinsLangue', label: 'Langue', icon: Globe },
                { name: 'freinsNumerique', label: 'Numérique', icon: Monitor }
              ].map(frein => (
                <label key={frein.name} className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer ${ficheProForm[frein.name] ? 'bg-orange-500/20 border-orange-500' : bg('bg-slate-700', 'bg-gray-100')} border`}>
                  <input type="checkbox" name={frein.name} checked={ficheProForm[frein.name] || false} onChange={handleFicheProChange} className="sr-only" />
                  <frein.icon className={`w-4 h-4 ${ficheProForm[frein.name] ? 'text-orange-500' : text('text-slate-400', 'text-gray-500')}`} />
                  <span className={`text-sm ${text('text-white', 'text-gray-900')}`}>{frein.label}</span>
                </label>
              ))}
            </div>
            <Input label="Autres freins" name="freinsAutres" type="textarea" value={ficheProForm.freinsAutres} onChange={handleFicheProChange} placeholder="Décrire les autres freins identifiés..." />

            <h4 className={`font-medium mt-4 ${text('text-white', 'text-gray-900')}`}>Projet professionnel</h4>
            <Input label="Description du projet" name="projetPro" type="textarea" value={ficheProForm.projetPro} onChange={handleFicheProChange} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Métiers visés" name="metiersVises" type="textarea" value={ficheProForm.metiersVises} onChange={handleFicheProChange} />
              <Input label="Secteurs d'activité visés" name="secteursVises" type="textarea" value={ficheProForm.secteursVises} onChange={handleFicheProChange} />
            </div>

            <h4 className={`font-medium mt-4 ${text('text-white', 'text-gray-900')}`}>Objectifs du parcours</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Court terme (3 mois)" name="objectifsCourt" type="textarea" value={ficheProForm.objectifsCourt} onChange={handleFicheProChange} />
              <Input label="Moyen terme (6 mois)" name="objectifsMoyen" type="textarea" value={ficheProForm.objectifsMoyen} onChange={handleFicheProChange} />
              <Input label="Long terme (fin contrat)" name="objectifsLong" type="textarea" value={ficheProForm.objectifsLong} onChange={handleFicheProChange} />
            </div>
          </div>
        </Section>

        {/* Suivis / Entretiens */}
        <Section title="Suivis / Entretiens CIP" icon={ClipboardList}
          action={<button onClick={() => { setSuiviForm({ dateEntretien: new Date().toISOString().split('T')[0], typeEntretien: 'Mensuel', duree: 45 }); setShowSuiviModal(true); }} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Nouvel entretien
          </button>}>
          {emp.suivis && emp.suivis.length > 0 ? (
            <div className="space-y-3">
              {emp.suivis.map((suivi: any) => (
                <div key={suivi.id} className={`p-4 rounded-lg ${bg('bg-slate-700/50', 'bg-gray-50')} border ${bg('border-slate-600', 'border-gray-200')}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${suivi.typeEntretien === 'Bilan' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                          {suivi.typeEntretien}
                        </span>
                        <span className={`text-sm font-medium ${text('text-white', 'text-gray-900')}`}>
                          {formatDate(suivi.dateEntretien)}
                        </span>
                        {suivi.duree && <span className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>{suivi.duree} min</span>}
                        {suivi.conseillerNom && <span className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>par {suivi.conseillerNom}</span>}
                      </div>
                      <p className={`text-sm ${text('text-slate-300', 'text-gray-700')}`}><strong>Objet :</strong> {suivi.objetEntretien}</p>
                      {suivi.pointsAbordes && <p className={`text-sm mt-1 ${text('text-slate-400', 'text-gray-600')}`}><strong>Points abordés :</strong> {suivi.pointsAbordes}</p>}
                      {suivi.actionsDecidees && <p className={`text-sm mt-1 ${text('text-slate-400', 'text-gray-600')}`}><strong>Actions décidées :</strong> {suivi.actionsDecidees}</p>}
                      {suivi.dateProchainRdv && <p className={`text-sm mt-1 text-blue-400`}><strong>Prochain RDV :</strong> {formatDate(suivi.dateProchainRdv)}</p>}
                    </div>
                    <button onClick={() => deleteSuivi(suivi.id)} className="p-1.5 rounded hover:bg-red-500/20 text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={`text-sm ${text('text-slate-400', 'text-gray-500')} text-center py-8`}>Aucun entretien enregistré</p>
          )}
        </Section>

        {/* PMSMP */}
        <Section title="Conventions PMSMP" icon={Building2}
          action={<button onClick={() => { setPmsmpForm({ dateDebut: '', dateFin: '', statut: 'planifiee' }); setShowPMSMPModal(true); }} className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700">
            <Plus className="w-4 h-4" /> Nouvelle PMSMP
          </button>}>
          {emp.conventionsPMSMP && emp.conventionsPMSMP.length > 0 ? (
            <div className="space-y-3">
              {emp.conventionsPMSMP.map((pmsmp: any) => (
                <div key={pmsmp.id} className={`p-4 rounded-lg ${bg('bg-slate-700/50', 'bg-gray-50')} border ${bg('border-slate-600', 'border-gray-200')}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`font-medium ${text('text-white', 'text-gray-900')}`}>{pmsmp.entrepriseNom}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          pmsmp.statut === 'terminee' ? 'bg-green-500/20 text-green-400' :
                          pmsmp.statut === 'en_cours' ? 'bg-blue-500/20 text-blue-400' :
                          pmsmp.statut === 'annulee' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}>{pmsmp.statut}</span>
                      </div>
                      <p className={`text-sm ${text('text-slate-300', 'text-gray-700')}`}>
                        Du {formatDate(pmsmp.dateDebut)} au {formatDate(pmsmp.dateFin)} ({pmsmp.dureeJours || '-'} jours)
                      </p>
                      {pmsmp.tuteurNom && <p className={`text-sm ${text('text-slate-400', 'text-gray-600')}`}>Tuteur : {pmsmp.tuteurNom} - {pmsmp.tuteurFonction}</p>}
                      {pmsmp.objectifDecouverte && <p className={`text-sm mt-2 ${text('text-slate-400', 'text-gray-600')}`}><strong>Objectif :</strong> {pmsmp.objectifDecouverte}</p>}
                      {pmsmp.bilanRealise && pmsmp.evaluationEntreprise && (
                        <p className={`text-sm mt-2 ${pmsmp.evaluationEntreprise === 'Très satisfaisant' ? 'text-green-400' : pmsmp.evaluationEntreprise === 'Satisfaisant' ? 'text-blue-400' : 'text-orange-400'}`}>
                          <strong>Évaluation :</strong> {pmsmp.evaluationEntreprise}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={`text-sm ${text('text-slate-400', 'text-gray-500')} text-center py-8`}>Aucune PMSMP enregistrée</p>
          )}
        </Section>

        {/* Formations */}
        <Section title="Formations" icon={GraduationCap}
          action={<button onClick={() => { setFormationForm({ dateDebut: '', statut: 'planifiee' }); setShowFormationModal(true); }} className="flex items-center gap-1 px-3 py-1.5 bg-cyan-600 text-white text-sm rounded-lg hover:bg-cyan-700">
            <Plus className="w-4 h-4" /> Nouvelle formation
          </button>}>
          {emp.formations && emp.formations.length > 0 ? (
            <div className="space-y-3">
              {emp.formations.map((formation: any) => (
                <div key={formation.id} className={`p-4 rounded-lg ${bg('bg-slate-700/50', 'bg-gray-50')} border ${bg('border-slate-600', 'border-gray-200')}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`font-medium ${text('text-white', 'text-gray-900')}`}>{formation.intitule}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      formation.statut === 'terminee' ? 'bg-green-500/20 text-green-400' :
                      formation.statut === 'en_cours' ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>{formation.statut}</span>
                    {formation.resultat && (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${formation.resultat === 'Validée' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {formation.resultat}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm ${text('text-slate-300', 'text-gray-700')}`}>
                    {formation.organisme} - {formation.dureeHeures}h - Du {formatDate(formation.dateDebut)} au {formatDate(formation.dateFin)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className={`text-sm ${text('text-slate-400', 'text-gray-500')} text-center py-8`}>Aucune formation enregistrée</p>
          )}
        </Section>

        {/* CV */}
        <Section title="CV" icon={FileText}>
          <div className="flex items-center justify-between p-4 rounded-lg border border-dashed border-slate-500">
            <div>
              {ficheProForm.cvUrl ? (
                <p className={`text-sm ${text('text-white', 'text-gray-900')}`}>CV enregistré - Dernière mise à jour : {formatDate(ficheProForm.cvDateMaj)}</p>
              ) : (
                <p className={`text-sm ${text('text-slate-400', 'text-gray-500')}`}>Aucun CV enregistré</p>
              )}
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Upload className="w-4 h-4" /> {ficheProForm.cvUrl ? 'Mettre à jour' : 'Ajouter CV'}
            </button>
          </div>
        </Section>
      </div>
    );
  };

  // DOSSIER ADMIN
  const renderDossierAdmin = () => {
    if (!selectedEmployee) return null;
    const emp = selectedEmployee;
    const docsAdmin = [
      { type: 'CNI', label: 'Carte d\'identité / Titre de séjour', obligatoire: true, icon: IdCard },
      { type: 'CARTE_VITALE', label: 'Carte Vitale', obligatoire: true, icon: CreditCard },
      { type: 'JUSTIF_DOMICILE', label: 'Justificatif de domicile (< 3 mois)', obligatoire: true, icon: MapPin },
      { type: 'ATTESTATION_SECU', label: 'Attestation de sécurité sociale', obligatoire: true, icon: Shield },
      { type: 'RIB', label: 'Relevé d\'Identité Bancaire (RIB)', obligatoire: true, icon: Banknote },
      { type: 'PERMIS', label: 'Permis de conduire', obligatoire: false, icon: Car },
      { type: 'ATTESTATION_CAF', label: 'Attestation CAF', obligatoire: false, icon: Receipt },
      { type: 'ATTESTATION_FT', label: 'Attestation France Travail', obligatoire: false, icon: Landmark },
      { type: 'ATTESTATION_MDPH', label: 'Attestation MDPH / RQTH', obligatoire: false, icon: Heart }
    ];

    return (
      <div className="space-y-6">
        <div className={`p-4 rounded-lg ${bg('bg-blue-900/30', 'bg-blue-50')} border ${bg('border-blue-700', 'border-blue-200')}`}>
          <p className={`text-sm ${text('text-blue-300', 'text-blue-700')}`}>
            <AlertCircle className="w-4 h-4 inline mr-2" />
            Les documents marqués d'un <span className="text-red-500 font-bold">*</span> sont obligatoires et requis lors des contrôles.
          </p>
        </div>

        <Section title="Documents administratifs" icon={FolderOpen}
          action={<button onClick={() => { setDocumentForm({ categorie: 'ADMIN' }); setShowDocumentModal(true); }} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
            <Upload className="w-4 h-4" /> Ajouter un document
          </button>}>
          <div className="space-y-3">
            {docsAdmin.map(doc => {
              const docPresent = emp.documents?.find((d: any) => d.typeDocument === doc.type);
              const isExpired = docPresent?.dateExpiration && new Date(docPresent.dateExpiration) < new Date();
              const expireSoon = docPresent?.dateExpiration && new Date(docPresent.dateExpiration) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

              return (
                <div key={doc.type} className={`flex items-center justify-between p-4 rounded-lg border ${
                  docPresent
                    ? isExpired
                      ? 'bg-red-500/10 border-red-500/50'
                      : expireSoon
                        ? 'bg-orange-500/10 border-orange-500/50'
                        : `${bg('bg-green-500/10', 'bg-green-50')} border-green-500/50`
                    : doc.obligatoire
                      ? 'bg-red-500/10 border-red-500/50'
                      : `${bg('bg-slate-700/50', 'bg-gray-50')} ${bg('border-slate-600', 'border-gray-200')}`
                }`}>
                  <div className="flex items-center gap-4">
                    <doc.icon className={`w-6 h-6 ${
                      docPresent
                        ? isExpired ? 'text-red-500' : expireSoon ? 'text-orange-500' : 'text-green-500'
                        : doc.obligatoire ? 'text-red-500' : text('text-slate-400', 'text-gray-400')
                    }`} />
                    <div>
                      <p className={`font-medium ${text('text-white', 'text-gray-900')}`}>
                        {doc.label} {doc.obligatoire && <span className="text-red-500">*</span>}
                      </p>
                      {docPresent ? (
                        <div className="flex items-center gap-2 mt-1">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>
                            Ajouté le {formatDate(docPresent.createdAt)}
                          </span>
                          {docPresent.dateExpiration && (
                            <span className={`text-xs ${isExpired ? 'text-red-500' : expireSoon ? 'text-orange-500' : text('text-slate-400', 'text-gray-500')}`}>
                              - {isExpired ? 'EXPIRÉ' : `Expire le ${formatDate(docPresent.dateExpiration)}`}
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className={`text-xs ${doc.obligatoire ? 'text-red-400' : text('text-slate-400', 'text-gray-500')}`}>
                          {doc.obligatoire ? 'Document manquant - OBLIGATOIRE' : 'Non fourni'}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {docPresent ? (
                      <>
                        <button className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded text-sm hover:bg-blue-500/30">
                          <Eye className="w-4 h-4" /> Voir
                        </button>
                        <button className="flex items-center gap-1 px-3 py-1.5 bg-green-500/20 text-green-400 rounded text-sm hover:bg-green-500/30">
                          <RefreshCw className="w-4 h-4" /> Remplacer
                        </button>
                        <button onClick={() => deleteDocument(docPresent.id)} className="p-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => { setDocumentForm({ categorie: 'ADMIN', typeDocument: doc.type, nomDocument: doc.label, estObligatoire: doc.obligatoire }); setShowDocumentModal(true); }}
                        className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        <Upload className="w-4 h-4" /> Ajouter
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      </div>
    );
  };

  // DOSSIER RH
  const renderDossierRH = () => {
    if (!selectedEmployee) return null;
    const emp = selectedEmployee;
    const docsRH = [
      { type: 'PASS_INCLUSION', label: 'Pass Inclusion (Agrément IAE)', obligatoire: true, icon: BadgeCheck },
      { type: 'DPAE', label: 'DPAE - Déclaration Préalable à l\'Embauche', obligatoire: true, icon: FileSignature },
      { type: 'FICHE_EMBAUCHE', label: 'Fiche d\'embauche', obligatoire: true, icon: ClipboardList },
      { type: 'CONTRAT', label: 'Contrat de travail signé (CDDI)', obligatoire: true, icon: FileText },
      { type: 'AVENANT', label: 'Avenant(s) au contrat', obligatoire: false, icon: FileText },
      { type: 'RENOUVELLEMENT', label: 'Renouvellement + nouvelle DPAE', obligatoire: false, icon: RefreshCw },
      { type: 'SOLDE_TOUT_COMPTE', label: 'Solde de tout compte', obligatoire: false, icon: Euro },
      { type: 'CERTIFICAT_TRAVAIL', label: 'Certificat de travail', obligatoire: false, icon: Award }
    ];

    return (
      <div className="space-y-6">
        {/* Documents RH */}
        <Section title="Documents RH obligatoires" icon={Folder}
          action={<button onClick={() => { setDocumentForm({ categorie: 'RH' }); setShowDocumentModal(true); }} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
            <Upload className="w-4 h-4" /> Ajouter
          </button>}>
          <div className="space-y-3">
            {docsRH.map(doc => {
              const docPresent = emp.documents?.find((d: any) => d.typeDocument === doc.type);
              return (
                <div key={doc.type} className={`flex items-center justify-between p-4 rounded-lg border ${
                  docPresent
                    ? `${bg('bg-green-500/10', 'bg-green-50')} border-green-500/50`
                    : doc.obligatoire
                      ? 'bg-red-500/10 border-red-500/50'
                      : `${bg('bg-slate-700/50', 'bg-gray-50')} ${bg('border-slate-600', 'border-gray-200')}`
                }`}>
                  <div className="flex items-center gap-4">
                    <doc.icon className={`w-6 h-6 ${docPresent ? 'text-green-500' : doc.obligatoire ? 'text-red-500' : text('text-slate-400', 'text-gray-400')}`} />
                    <div>
                      <p className={`font-medium ${text('text-white', 'text-gray-900')}`}>
                        {doc.label} {doc.obligatoire && <span className="text-red-500">*</span>}
                      </p>
                      {docPresent ? (
                        <p className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>Ajouté le {formatDate(docPresent.createdAt)}</p>
                      ) : (
                        <p className={`text-xs ${doc.obligatoire ? 'text-red-400' : text('text-slate-400', 'text-gray-500')}`}>
                          {doc.obligatoire ? 'OBLIGATOIRE' : 'Non fourni'}
                        </p>
                      )}
                    </div>
                  </div>
                  {docPresent ? (
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded text-sm"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => deleteDocument(docPresent.id)} className="p-1.5 bg-red-500/20 text-red-400 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <button onClick={() => { setDocumentForm({ categorie: 'RH', typeDocument: doc.type, nomDocument: doc.label, estObligatoire: doc.obligatoire }); setShowDocumentModal(true); }} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">
                      <Upload className="w-4 h-4 inline mr-1" /> Ajouter
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </Section>

        {/* Contrats */}
        <Section title="Historique des contrats" icon={FileSignature}
          action={<button onClick={() => { setContratForm({ typeContrat: 'CDDI', dureeHeures: emp.dureeHebdo, statut: 'actif' }); setShowContratModal(true); }} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">
            <Plus className="w-4 h-4" /> Nouveau contrat / Renouvellement
          </button>}>
          {emp.contrats && emp.contrats.length > 0 ? (
            <div className="space-y-3">
              {emp.contrats.map((contrat: any, index: number) => (
                <div key={contrat.id} className={`p-4 rounded-lg border ${contrat.statut === 'actif' ? 'bg-green-500/10 border-green-500/50' : `${bg('bg-slate-700/50', 'bg-gray-50')} ${bg('border-slate-600', 'border-gray-200')}`}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className={`font-medium ${text('text-white', 'text-gray-900')}`}>{contrat.typeContrat}</span>
                        <span className={`px-2 py-1 rounded text-xs ${contrat.statut === 'actif' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                          {contrat.motif || (index === 0 ? 'Initial' : `Renouvellement ${index}`)}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${contrat.statut === 'actif' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                          {contrat.statut}
                        </span>
                      </div>
                      <p className={`text-sm mt-1 ${text('text-slate-300', 'text-gray-700')}`}>
                        Du {formatDate(contrat.dateDebut)} au {formatDate(contrat.dateFin)} - {contrat.dureeHeures}h/semaine
                      </p>
                      {contrat.dpaeNumero && <p className={`text-xs mt-1 ${text('text-slate-400', 'text-gray-500')}`}>DPAE : {contrat.dpaeNumero} du {formatDate(contrat.dpaeDate)}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={`text-sm ${text('text-slate-400', 'text-gray-500')} text-center py-8`}>Aucun contrat enregistré</p>
          )}
        </Section>

        {/* Avertissements */}
        <Section title="Procédures disciplinaires" icon={Gavel}
          action={<button onClick={() => { setAvertissementForm({ dateAvertissement: new Date().toISOString().split('T')[0], type: 'Écrit' }); setShowAvertissementModal(true); }} className="flex items-center gap-1 px-3 py-1.5 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700">
            <Plus className="w-4 h-4" /> Nouvel avertissement
          </button>}>
          {emp.avertissements && emp.avertissements.length > 0 ? (
            <div className="space-y-3">
              {emp.avertissements.map((avert: any) => (
                <div key={avert.id} className="p-4 rounded-lg bg-red-500/10 border border-red-500/50">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-400">{avert.type}</span>
                    <span className={`font-medium ${text('text-white', 'text-gray-900')}`}>{formatDate(avert.dateAvertissement)}</span>
                  </div>
                  <p className={`text-sm ${text('text-slate-300', 'text-gray-700')}`}><strong>Motif :</strong> {avert.motif}</p>
                  {avert.description && <p className={`text-sm mt-1 ${text('text-slate-400', 'text-gray-600')}`}>{avert.description}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className={`text-sm text-green-400 text-center py-8`}>Aucune procédure disciplinaire</p>
          )}
        </Section>
      </div>
    );
  };

  // Modals
  const Modal = ({ show, onClose, title, children, onSave, saving }: any) => {
    if (!show) return null;
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className={`${bg('bg-slate-800', 'bg-white')} rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
          <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
            <h2 className={`text-lg font-bold ${text('text-white', 'text-gray-900')}`}>{title}</h2>
            <button onClick={onClose}><X className="w-5 h-5" /></button>
          </div>
          <div className="p-4">{children}</div>
          <div className="p-4 border-t border-slate-700/50 flex justify-end gap-3">
            <button onClick={onClose} className={`px-4 py-2 rounded-lg ${bg('bg-slate-700', 'bg-gray-200')}`}>Annuler</button>
            <button onClick={onSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg">{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
          </div>
        </div>
      </div>
    );
  };

  // RENDU PRINCIPAL

  // Écran de chargement initial (vérification auth)
  if (authLoading) {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-slate-400">Chargement...</p>
        </div>
      </div>
    );
  }

  // Écran de connexion
  if (!isAuthenticated) {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-slate-800 rounded-2xl p-8 shadow-xl border border-slate-700">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">RH Insertion</h1>
              <p className="text-slate-400 mt-2">Connexion requise</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm text-center">
                  {loginError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Identifiant</label>
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Entrez votre identifiant"
                  required
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Mot de passe</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Entrez votre mot de passe"
                  required
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {loginLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    Connexion...
                  </>
                ) : (
                  <>
                    <LogOut className="w-5 h-5" />
                    Se connecter
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-slate-500 text-xs mt-6">
              Accès restreint - Personnel autorisé uniquement
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ darkMode }}>
    <div className={`h-screen overflow-hidden ${bg('bg-slate-900', 'bg-gray-50')}`}>
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full ${sidebarOpen ? 'w-64' : 'w-16'} ${bg('bg-slate-800', 'bg-white')} border-r ${bg('border-slate-700', 'border-gray-200')} transition-all z-40`}>
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center"><Users className="w-6 h-6 text-white" /></div>
            {sidebarOpen && <div><h1 className={`font-bold ${text('text-white', 'text-gray-900')}`}>RH Insertion</h1><p className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>Valotik</p></div>}
          </div>
        </div>
        <nav className="p-3 space-y-1">
          {[{ id: 'dashboard', icon: Home, label: 'Tableau de bord' }, { id: 'liste', icon: Users, label: 'Salariés' }, { id: 'pointages', icon: Clock, label: 'Pointages' }, { id: 'agenda', icon: Calendar, label: 'Agenda' }, { id: 'organisme', icon: Landmark, label: 'Organisme' }].map(item => (
            <button key={item.id} onClick={() => { setActiveView(item.id as any); setSelectedEmployee(null); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg ${activeView === item.id || (activeView === 'fiche' && item.id === 'liste') ? 'bg-blue-600 text-white' : `${text('text-slate-300 hover:bg-slate-700', 'text-gray-700 hover:bg-gray-100')}`}`}>
              <item.icon className="w-5 h-5" />{sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-4 left-0 right-0 px-3">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className={`w-full flex items-center justify-center py-2 rounded-lg ${bg('hover:bg-slate-700', 'hover:bg-gray-100')}`}>
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Contenu */}
      <div className={`${sidebarOpen ? 'ml-64' : 'ml-16'} transition-all h-full flex flex-col`}>
        <header className={`sticky top-0 z-30 ${bg('bg-slate-800/90', 'bg-white/90')} backdrop-blur border-b ${bg('border-slate-700', 'border-gray-200')}`}>
          <div className="flex items-center justify-between px-6 py-3">
            <a href="/" className={`text-sm ${text('text-slate-400 hover:text-white', 'text-gray-500 hover:text-gray-900')}`}>Retour CRM</a>
            <div className="flex items-center gap-3">
              {authUser && <span className={`text-sm ${text('text-slate-400', 'text-gray-500')}`}>{authUser.username}</span>}
              <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-lg ${bg('hover:bg-slate-700', 'hover:bg-gray-100')}`}>{darkMode ? '☀️' : '🌙'}</button>
              <button onClick={loadData} className={`p-2 rounded-lg ${bg('hover:bg-slate-700', 'hover:bg-gray-100')}`}><RefreshCw className="w-5 h-5" /></button>
              <button onClick={handleLogout} className={`p-2 rounded-lg text-red-400 ${bg('hover:bg-slate-700', 'hover:bg-gray-100')}`} title="Déconnexion"><LogOut className="w-5 h-5" /></button>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>
        ) : activeView === 'fiche' && selectedEmployee ? (
          <div className="flex-1 overflow-auto p-6">
            {/* Header fiche */}
            <div className="flex items-center gap-4 mb-6">
              <button onClick={() => { setActiveView('liste'); setSelectedEmployee(null); }} className={`p-2 rounded-lg ${bg('hover:bg-slate-700', 'hover:bg-gray-100')}`}>
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex-1">
                <h1 className={`text-2xl font-bold ${text('text-white', 'text-gray-900')}`}>{selectedEmployee.civilite} {selectedEmployee.prenom} {selectedEmployee.nom}</h1>
                <p className={`text-sm ${text('text-slate-400', 'text-gray-500')}`}>{selectedEmployee.poste || 'Poste non défini'} - {selectedEmployee.typeContrat} {selectedEmployee.dureeHebdo}h</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${selectedEmployee.statut === 'actif' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                {selectedEmployee.statut}
              </span>
            </div>
            {/* Onglets */}
            <div className={`${bg('bg-slate-800', 'bg-white')} rounded-t-xl border-b ${bg('border-slate-700', 'border-gray-200')}`}>
              <div className="flex">
                {[{ id: 'info', label: 'Informations', icon: User }, { id: 'parcours', label: 'Parcours', icon: TrendingUp }, { id: 'pro', label: 'Dossier PRO', icon: Briefcase }, { id: 'admin', label: 'Dossier ADMIN', icon: FolderOpen }, { id: 'rh', label: 'Dossier RH', icon: FileText }].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-blue-500 text-blue-500' : `border-transparent ${text('text-slate-400 hover:text-white', 'text-gray-500 hover:text-gray-900')}`}`}>
                    <tab.icon className="w-4 h-4" />{tab.label}
                  </button>
                ))}
              </div>
            </div>
            <div className={`${bg('bg-slate-800/50', 'bg-white')} rounded-b-xl ${activeTab === 'parcours' ? '' : 'p-6'}`}>
              {activeTab === 'info' && renderFicheInformation()}
              {activeTab === 'parcours' && renderParcours()}
              {activeTab === 'pro' && renderDossierPro()}
              {activeTab === 'admin' && renderDossierAdmin()}
              {activeTab === 'rh' && renderDossierRH()}
            </div>
          </div>
        ) : activeView === 'pointages' ? (
          <div className="flex-1 overflow-auto">{renderPointages()}</div>
        ) : activeView === 'agenda' ? (
          <div className="flex-1 overflow-hidden">{renderAgenda()}</div>
        ) : activeView === 'organisme' ? (
          <div className="flex-1 overflow-auto p-6">{renderOrganisme()}</div>
        ) : activeView === 'liste' ? (
          <div className="flex-1 overflow-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <div><h1 className={`text-2xl font-bold ${text('text-white', 'text-gray-900')}`}>Salariés en insertion</h1><p className={`text-sm ${text('text-slate-400', 'text-gray-500')}`}>{filteredEmployees.length} salarié(s)</p></div>
              <div className="flex gap-2">
                <button onClick={generateSyntheseEffectifsPDF} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"><FileDown className="w-4 h-4" />Export PDF</button>
                <button onClick={() => { setFormData({ civilite: 'M.', typeContrat: 'CDDI', dureeHebdo: 26, statut: 'actif', nationalite: 'Française' }); setShowNewEmployeeModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><UserPlus className="w-4 h-4" />Nouveau</button>
              </div>
            </div>
            <div className={`${bg('bg-slate-800', 'bg-white')} rounded-xl border ${bg('border-slate-700', 'border-gray-200')} p-4 mb-6`}>
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
                  <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={`w-full pl-10 pr-4 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`} />
                </div>
                <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)} className={`px-4 py-2 rounded-lg ${bg('bg-slate-700 text-white', 'bg-gray-100')}`}>
                  <option value="">Tous</option><option value="actif">Actifs</option><option value="sorti">Sortis</option>
                </select>
              </div>
            </div>
            <div className={`${bg('bg-slate-800', 'bg-white')} rounded-xl border ${bg('border-slate-700', 'border-gray-200')} overflow-hidden`}>
              <table className="w-full">
                <thead><tr className={`text-left text-xs ${text('text-slate-400', 'text-gray-500')} border-b ${bg('border-slate-700', 'border-gray-200')}`}>
                  <th className="px-4 py-3">Salarié</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Contrat</th><th className="px-4 py-3">Entrée</th><th className="px-4 py-3">Dossier</th><th className="px-4 py-3"></th>
                </tr></thead>
                <tbody>
                  {filteredEmployees.map(emp => (
                    <tr key={emp.id} onClick={() => loadEmployeeDetails(emp.id)} className={`border-b ${bg('border-slate-700/50 hover:bg-slate-700/30', 'border-gray-100 hover:bg-gray-50')} cursor-pointer`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${emp.statut === 'actif' ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                            <span className={`text-sm font-medium ${emp.statut === 'actif' ? 'text-green-500' : 'text-gray-400'}`}>{emp.prenom[0]}{emp.nom[0]}</span>
                          </div>
                          <div><p className={`font-medium ${text('text-white', 'text-gray-900')}`}>{emp.civilite} {emp.prenom} {emp.nom}</p><p className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>{emp.poste || '-'}</p></div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><p className="text-sm">{emp.telephone}</p><p className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>{emp.email || '-'}</p></td>
                      <td className="px-4 py-3"><span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">{emp.typeContrat} {emp.dureeHebdo}h</span></td>
                      <td className="px-4 py-3 text-sm">{formatDate(emp.dateEntree)}</td>
                      <td className="px-4 py-3">{emp.stats?.dossierComplet ? <CheckCircle className="w-5 h-5 text-green-500" /> : <div className="flex items-center gap-1"><AlertCircle className="w-5 h-5 text-orange-500" /><span className="text-xs text-orange-500">{emp.stats?.documentsManquants}</span></div>}</td>
                      <td className="px-4 py-3"><Eye className="w-4 h-4 text-blue-500" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Dashboard */
          <div className="flex-1 overflow-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div><h1 className={`text-2xl font-bold ${text('text-white', 'text-gray-900')}`}>Tableau de bord</h1></div>
              <div className="flex gap-2">
                <button onClick={generateSyntheseEffectifsPDF} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                  <FileDown className="w-4 h-4" />Export synthèse
                </button>
                <button onClick={() => { setFormData({ civilite: 'M.', typeContrat: 'CDDI', dureeHebdo: 26, statut: 'actif', nationalite: 'Française' }); setShowNewEmployeeModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <UserPlus className="w-4 h-4" />Nouveau
                </button>
              </div>
            </div>
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className={`${bg('bg-slate-800', 'bg-white')} rounded-xl p-5 border ${bg('border-slate-700', 'border-gray-200')}`}>
                  <div className="flex justify-between"><div><p className={`text-sm ${text('text-slate-400', 'text-gray-500')}`}>Effectif actuel</p><p className={`text-3xl font-bold ${text('text-white', 'text-gray-900')}`}>{stats.effectifs.actifs}</p></div><Users className="w-10 h-10 text-blue-500/30" /></div>
                </div>
                <div className={`${bg('bg-slate-800', 'bg-white')} rounded-xl p-5 border ${bg('border-slate-700', 'border-gray-200')}`}>
                  <div className="flex justify-between"><div><p className={`text-sm ${text('text-slate-400', 'text-gray-500')}`}>Sorties positives</p><p className="text-3xl font-bold text-green-500">{stats.mouvements.tauxSortiePositive}%</p></div><Award className="w-10 h-10 text-green-500/30" /></div>
                </div>
                <div className={`${bg('bg-slate-800', 'bg-white')} rounded-xl p-5 border ${bg('border-slate-700', 'border-gray-200')}`}>
                  <div className="flex justify-between"><div><p className={`text-sm ${text('text-slate-400', 'text-gray-500')}`}>PMSMP</p><p className={`text-3xl font-bold ${text('text-white', 'text-gray-900')}`}>{stats.accompagnement.pmsmpAnnee}</p></div><Building2 className="w-10 h-10 text-purple-500/30" /></div>
                </div>
                <div className={`${bg('bg-slate-800', 'bg-white')} rounded-xl p-5 border ${bg('border-slate-700', 'border-gray-200')}`}>
                  <div className="flex justify-between"><div><p className={`text-sm ${text('text-slate-400', 'text-gray-500')}`}>Alertes</p><p className={`text-3xl font-bold ${stats.alertes.dossierIncomplets > 0 ? 'text-orange-500' : 'text-green-500'}`}>{stats.alertes.dossierIncomplets + stats.alertes.documentsExpires}</p></div><AlertTriangle className="w-10 h-10 text-orange-500/30" /></div>
                </div>
              </div>
            )}
            {/* Widget Objectifs Négociés 2026 */}
            {dashboardObjectifs?.objectif && (
              <div className={`${bg('bg-slate-800', 'bg-white')} rounded-xl border ${bg('border-slate-700', 'border-gray-200')} overflow-hidden`}>
                <div className="p-4 border-b border-slate-700/50 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-red-500" />
                    <h2 className={`font-semibold ${text('text-white', 'text-gray-900')}`}>Objectifs Négociés {new Date().getFullYear()}</h2>
                  </div>
                  <button onClick={() => setActiveView('organisme' as any)} className="text-sm text-blue-500 flex items-center gap-1">
                    Détails <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-5">
                  {/* Progression globale des sorties */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-sm font-medium ${text('text-slate-300', 'text-gray-700')}`}>Progression des sorties</span>
                      <span className={`text-lg font-bold ${dashboardObjectifs.statsTempsReel.progression >= 80 ? 'text-green-500' : dashboardObjectifs.statsTempsReel.progression >= 50 ? 'text-orange-500' : 'text-red-500'}`}>
                        {dashboardObjectifs.statsTempsReel.totalSorties} / {dashboardObjectifs.objectif.nombreSortiesPrevisionnel}
                      </span>
                    </div>
                    <div className={`h-4 rounded-full ${bg('bg-slate-700', 'bg-gray-200')} overflow-hidden`}>
                      <div
                        className={`h-full rounded-full transition-all ${dashboardObjectifs.statsTempsReel.progression >= 80 ? 'bg-green-500' : dashboardObjectifs.statsTempsReel.progression >= 50 ? 'bg-orange-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(dashboardObjectifs.statsTempsReel.progression, 100)}%` }}
                      />
                    </div>
                    <p className={`text-xs mt-1 ${text('text-slate-500', 'text-gray-400')}`}>
                      {dashboardObjectifs.statsTempsReel.progression}% de l'objectif annuel (mois {dashboardObjectifs.moisEcoules}/12)
                    </p>
                  </div>

                  {/* Indicateurs détaillés */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Sorties dynamiques */}
                    <div className={`p-3 rounded-lg ${bg('bg-slate-700/50', 'bg-gray-50')}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>Sorties dynamiques</span>
                        <span className={`text-xs font-medium ${(dashboardObjectifs.statsTempsReel.ecarts?.dynamiques || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {(dashboardObjectifs.statsTempsReel.ecarts?.dynamiques || 0) >= 0 ? '+' : ''}{(dashboardObjectifs.statsTempsReel.ecarts?.dynamiques || 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-end gap-2">
                        <span className={`text-2xl font-bold ${text('text-white', 'text-gray-900')}`}>
                          {(dashboardObjectifs.statsTempsReel.tauxReels?.sortiesDynamiques || 0).toFixed(1)}%
                        </span>
                        <span className={`text-xs ${text('text-slate-500', 'text-gray-400')} mb-1`}>/ {dashboardObjectifs.objectif.tauxSortiesDynamiquesCible}%</span>
                      </div>
                      <div className={`h-1.5 rounded-full ${bg('bg-slate-600', 'bg-gray-200')} mt-2 overflow-hidden`}>
                        <div className={`h-full rounded-full ${(dashboardObjectifs.statsTempsReel.ecarts?.dynamiques || 0) >= 0 ? 'bg-green-500' : 'bg-orange-500'}`}
                          style={{ width: `${Math.min((dashboardObjectifs.statsTempsReel.tauxReels?.sortiesDynamiques || 0) / dashboardObjectifs.objectif.tauxSortiesDynamiquesCible * 100, 100)}%` }} />
                      </div>
                    </div>

                    {/* Emploi durable */}
                    <div className={`p-3 rounded-lg ${bg('bg-slate-700/50', 'bg-gray-50')}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>Emploi durable</span>
                        <span className={`text-xs font-medium ${(dashboardObjectifs.statsTempsReel.ecarts?.emploiDurable || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {(dashboardObjectifs.statsTempsReel.ecarts?.emploiDurable || 0) >= 0 ? '+' : ''}{(dashboardObjectifs.statsTempsReel.ecarts?.emploiDurable || 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-end gap-2">
                        <span className={`text-2xl font-bold ${text('text-white', 'text-gray-900')}`}>
                          {(dashboardObjectifs.statsTempsReel.tauxReels?.emploiDurable || 0).toFixed(1)}%
                        </span>
                        <span className={`text-xs ${text('text-slate-500', 'text-gray-400')} mb-1`}>/ {dashboardObjectifs.objectif.tauxEmploiDurableCible}%</span>
                      </div>
                      <div className={`h-1.5 rounded-full ${bg('bg-slate-600', 'bg-gray-200')} mt-2 overflow-hidden`}>
                        <div className={`h-full rounded-full ${(dashboardObjectifs.statsTempsReel.ecarts?.emploiDurable || 0) >= 0 ? 'bg-green-500' : 'bg-orange-500'}`}
                          style={{ width: `${Math.min((dashboardObjectifs.statsTempsReel.tauxReels?.emploiDurable || 0) / dashboardObjectifs.objectif.tauxEmploiDurableCible * 100, 100)}%` }} />
                      </div>
                    </div>

                    {/* Emploi transition */}
                    <div className={`p-3 rounded-lg ${bg('bg-slate-700/50', 'bg-gray-50')}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>Emploi transition</span>
                        <span className={`text-xs font-medium ${(dashboardObjectifs.statsTempsReel.ecarts?.emploiTransition || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {(dashboardObjectifs.statsTempsReel.ecarts?.emploiTransition || 0) >= 0 ? '+' : ''}{(dashboardObjectifs.statsTempsReel.ecarts?.emploiTransition || 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-end gap-2">
                        <span className={`text-2xl font-bold ${text('text-white', 'text-gray-900')}`}>
                          {(dashboardObjectifs.statsTempsReel.tauxReels?.emploiTransition || 0).toFixed(1)}%
                        </span>
                        <span className={`text-xs ${text('text-slate-500', 'text-gray-400')} mb-1`}>/ {dashboardObjectifs.objectif.tauxEmploiTransitionCible}%</span>
                      </div>
                      <div className={`h-1.5 rounded-full ${bg('bg-slate-600', 'bg-gray-200')} mt-2 overflow-hidden`}>
                        <div className={`h-full rounded-full ${(dashboardObjectifs.statsTempsReel.ecarts?.emploiTransition || 0) >= 0 ? 'bg-green-500' : 'bg-orange-500'}`}
                          style={{ width: `${Math.min((dashboardObjectifs.statsTempsReel.tauxReels?.emploiTransition || 0) / dashboardObjectifs.objectif.tauxEmploiTransitionCible * 100, 100)}%` }} />
                      </div>
                    </div>

                    {/* Sorties positives */}
                    <div className={`p-3 rounded-lg ${bg('bg-slate-700/50', 'bg-gray-50')}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>Sorties positives</span>
                        <span className={`text-xs font-medium ${(dashboardObjectifs.statsTempsReel.ecarts?.sortiesPositives || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {(dashboardObjectifs.statsTempsReel.ecarts?.sortiesPositives || 0) >= 0 ? '+' : ''}{(dashboardObjectifs.statsTempsReel.ecarts?.sortiesPositives || 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-end gap-2">
                        <span className={`text-2xl font-bold ${text('text-white', 'text-gray-900')}`}>
                          {(dashboardObjectifs.statsTempsReel.tauxReels?.sortiesPositives || 0).toFixed(1)}%
                        </span>
                        <span className={`text-xs ${text('text-slate-500', 'text-gray-400')} mb-1`}>/ {dashboardObjectifs.objectif.tauxSortiesPositivesCible}%</span>
                      </div>
                      <div className={`h-1.5 rounded-full ${bg('bg-slate-600', 'bg-gray-200')} mt-2 overflow-hidden`}>
                        <div className={`h-full rounded-full ${(dashboardObjectifs.statsTempsReel.ecarts?.sortiesPositives || 0) >= 0 ? 'bg-green-500' : 'bg-orange-500'}`}
                          style={{ width: `${Math.min((dashboardObjectifs.statsTempsReel.tauxReels?.sortiesPositives || 0) / dashboardObjectifs.objectif.tauxSortiesPositivesCible * 100, 100)}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Compteurs sorties */}
                  <div className={`mt-4 pt-4 border-t ${bg('border-slate-700', 'border-gray-200')} grid grid-cols-5 gap-2 text-center`}>
                    <div>
                      <div className="text-lg font-bold text-green-500">{dashboardObjectifs.statsTempsReel.sortiesEmploiDurable}</div>
                      <div className={`text-xs ${text('text-slate-500', 'text-gray-400')}`}>Emploi durable</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-blue-500">{dashboardObjectifs.statsTempsReel.sortiesEmploiTransition}</div>
                      <div className={`text-xs ${text('text-slate-500', 'text-gray-400')}`}>Transition</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-purple-500">{dashboardObjectifs.statsTempsReel.sortiesFormation}</div>
                      <div className={`text-xs ${text('text-slate-500', 'text-gray-400')}`}>Formation</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-400">{dashboardObjectifs.statsTempsReel.sortiesPositives}</div>
                      <div className={`text-xs ${text('text-slate-500', 'text-gray-400')}`}>Positives</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-red-500">{dashboardObjectifs.statsTempsReel.sortiesNegatives}</div>
                      <div className={`text-xs ${text('text-slate-500', 'text-gray-400')}`}>Négatives</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className={`${bg('bg-slate-800', 'bg-white')} rounded-xl border ${bg('border-slate-700', 'border-gray-200')}`}>
              <div className="p-4 border-b border-slate-700/50 flex justify-between"><h2 className={`font-semibold ${text('text-white', 'text-gray-900')}`}>Salariés actifs</h2><button onClick={() => setActiveView('liste')} className="text-sm text-blue-500">Voir tout</button></div>
              <div className="divide-y divide-slate-700/50">
                {employees.filter(e => e.statut === 'actif').slice(0, 5).map(emp => (
                  <div key={emp.id} onClick={() => loadEmployeeDetails(emp.id)} className={`flex items-center justify-between p-4 cursor-pointer ${bg('hover:bg-slate-700/30', 'hover:bg-gray-50')}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center"><span className="text-sm font-medium text-blue-500">{emp.prenom[0]}{emp.nom[0]}</span></div>
                      <div><p className={`font-medium ${text('text-white', 'text-gray-900')}`}>{emp.prenom} {emp.nom}</p><p className={`text-xs ${text('text-slate-400', 'text-gray-500')}`}>{emp.poste} - Depuis le {formatDate(emp.dateEntree)}</p></div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <Modal show={showNewEmployeeModal} onClose={() => setShowNewEmployeeModal(false)} title="Nouveau salarié" onSave={saveEmployee} saving={saving}>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Civilité" name="civilite" type="select" value={formData.civilite} onChange={(e: any) => setFormData({...formData, [e.target.name]: e.target.value})} options={[{value:'M.',label:'M.'},{value:'Mme',label:'Mme'}]} required />
          <Input label="Nom" name="nom" value={formData.nom} onChange={(e: any) => setFormData({...formData, [e.target.name]: e.target.value})} required />
          <Input label="Prénom" name="prenom" value={formData.prenom} onChange={(e: any) => setFormData({...formData, [e.target.name]: e.target.value})} required />
          <Input label="Date naissance" name="dateNaissance" type="date" value={formData.dateNaissance} onChange={(e: any) => setFormData({...formData, [e.target.name]: e.target.value})} required />
          <Input label="Adresse" name="adresse" value={formData.adresse} onChange={(e: any) => setFormData({...formData, [e.target.name]: e.target.value})} className="col-span-2" required />
          <Input label="Code postal" name="codePostal" value={formData.codePostal} onChange={(e: any) => setFormData({...formData, [e.target.name]: e.target.value})} required />
          <Input label="Ville" name="ville" value={formData.ville} onChange={(e: any) => setFormData({...formData, [e.target.name]: e.target.value})} required />
          <Input label="Téléphone" name="telephone" value={formData.telephone} onChange={(e: any) => setFormData({...formData, [e.target.name]: e.target.value})} required />
          <Input label="Email" name="email" type="email" value={formData.email} onChange={(e: any) => setFormData({...formData, [e.target.name]: e.target.value})} />
          <Input label="Date entrée" name="dateEntree" type="date" value={formData.dateEntree} onChange={(e: any) => setFormData({...formData, [e.target.name]: e.target.value})} required />
          <Input label="Poste" name="poste" value={formData.poste} onChange={(e: any) => setFormData({...formData, [e.target.name]: e.target.value})} />
        </div>
      </Modal>

      <Modal show={showSuiviModal} onClose={() => setShowSuiviModal(false)} title="Nouvel entretien" onSave={saveSuivi} saving={saving}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date" name="dateEntretien" type="date" value={suiviForm.dateEntretien} onChange={(e: any) => setSuiviForm({...suiviForm, [e.target.name]: e.target.value})} required />
            <Input label="Type" name="typeEntretien" type="select" value={suiviForm.typeEntretien} onChange={(e: any) => setSuiviForm({...suiviForm, [e.target.name]: e.target.value})} options={[{value:'Hebdomadaire',label:'Hebdomadaire'},{value:'Mensuel',label:'Mensuel'},{value:'Bilan',label:'Bilan'},{value:'Urgent',label:'Urgent'}]} />
            <Input label="Durée (min)" name="duree" type="number" value={suiviForm.duree} onChange={(e: any) => setSuiviForm({...suiviForm, [e.target.name]: e.target.value})} />
            <Input label="Conseiller" name="conseillerNom" value={suiviForm.conseillerNom} onChange={(e: any) => setSuiviForm({...suiviForm, [e.target.name]: e.target.value})} />
          </div>
          <Input label="Objet" name="objetEntretien" type="textarea" value={suiviForm.objetEntretien} onChange={(e: any) => setSuiviForm({...suiviForm, [e.target.name]: e.target.value})} required />
          <Input label="Points abordés" name="pointsAbordes" type="textarea" value={suiviForm.pointsAbordes} onChange={(e: any) => setSuiviForm({...suiviForm, [e.target.name]: e.target.value})} />
          <Input label="Actions décidées" name="actionsDecidees" type="textarea" value={suiviForm.actionsDecidees} onChange={(e: any) => setSuiviForm({...suiviForm, [e.target.name]: e.target.value})} />
          <Input label="Prochain RDV" name="dateProchainRdv" type="date" value={suiviForm.dateProchainRdv} onChange={(e: any) => setSuiviForm({...suiviForm, [e.target.name]: e.target.value})} />
        </div>
      </Modal>

      <Modal show={showPMSMPModal} onClose={() => setShowPMSMPModal(false)} title="Nouvelle PMSMP" onSave={savePMSMP} saving={saving}>
        <div className="space-y-4">
          <Input label="Entreprise" name="entrepriseNom" value={pmsmpForm.entrepriseNom} onChange={(e: any) => setPmsmpForm({...pmsmpForm, [e.target.name]: e.target.value})} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="SIRET" name="entrepriseSiret" value={pmsmpForm.entrepriseSiret} onChange={(e: any) => setPmsmpForm({...pmsmpForm, [e.target.name]: e.target.value})} />
            <Input label="Adresse" name="entrepriseAdresse" value={pmsmpForm.entrepriseAdresse} onChange={(e: any) => setPmsmpForm({...pmsmpForm, [e.target.name]: e.target.value})} />
            <Input label="Tuteur" name="tuteurNom" value={pmsmpForm.tuteurNom} onChange={(e: any) => setPmsmpForm({...pmsmpForm, [e.target.name]: e.target.value})} />
            <Input label="Fonction tuteur" name="tuteurFonction" value={pmsmpForm.tuteurFonction} onChange={(e: any) => setPmsmpForm({...pmsmpForm, [e.target.name]: e.target.value})} />
            <Input label="Date début" name="dateDebut" type="date" value={pmsmpForm.dateDebut} onChange={(e: any) => setPmsmpForm({...pmsmpForm, [e.target.name]: e.target.value})} required />
            <Input label="Date fin" name="dateFin" type="date" value={pmsmpForm.dateFin} onChange={(e: any) => setPmsmpForm({...pmsmpForm, [e.target.name]: e.target.value})} required />
          </div>
          <Input label="Objectif" name="objectifDecouverte" type="textarea" value={pmsmpForm.objectifDecouverte} onChange={(e: any) => setPmsmpForm({...pmsmpForm, [e.target.name]: e.target.value})} />
        </div>
      </Modal>

      <Modal show={showFormationModal} onClose={() => setShowFormationModal(false)} title="Nouvelle formation" onSave={saveFormation} saving={saving}>
        <div className="space-y-4">
          <Input label="Intitulé" name="intitule" value={formationForm.intitule} onChange={(e: any) => setFormationForm({...formationForm, [e.target.name]: e.target.value})} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Organisme" name="organisme" value={formationForm.organisme} onChange={(e: any) => setFormationForm({...formationForm, [e.target.name]: e.target.value})} />
            <Input label="Type" name="type" type="select" value={formationForm.type} onChange={(e: any) => setFormationForm({...formationForm, [e.target.name]: e.target.value})} options={[{value:'Interne',label:'Interne'},{value:'Externe',label:'Externe'},{value:'E-learning',label:'E-learning'}]} />
            <Input label="Date début" name="dateDebut" type="date" value={formationForm.dateDebut} onChange={(e: any) => setFormationForm({...formationForm, [e.target.name]: e.target.value})} required />
            <Input label="Date fin" name="dateFin" type="date" value={formationForm.dateFin} onChange={(e: any) => setFormationForm({...formationForm, [e.target.name]: e.target.value})} />
            <Input label="Durée (h)" name="dureeHeures" type="number" value={formationForm.dureeHeures} onChange={(e: any) => setFormationForm({...formationForm, [e.target.name]: e.target.value})} />
          </div>
          <Input label="Objectifs" name="objectifs" type="textarea" value={formationForm.objectifs} onChange={(e: any) => setFormationForm({...formationForm, [e.target.name]: e.target.value})} />
        </div>
      </Modal>

      <Modal show={showDocumentModal} onClose={() => setShowDocumentModal(false)} title="Ajouter un document" onSave={saveDocument} saving={saving}>
        <div className="space-y-4">
          <Input label="Type" name="typeDocument" type="select" value={documentForm.typeDocument} onChange={(e: any) => setDocumentForm({...documentForm, [e.target.name]: e.target.value})} required
            options={[
              {value:'CNI',label:'Carte d\'identité'},{value:'CARTE_VITALE',label:'Carte Vitale'},{value:'JUSTIF_DOMICILE',label:'Justificatif domicile'},
              {value:'ATTESTATION_SECU',label:'Attestation sécu'},{value:'RIB',label:'RIB'},{value:'PERMIS',label:'Permis'},
              {value:'PASS_INCLUSION',label:'Pass Inclusion'},{value:'DPAE',label:'DPAE'},{value:'CONTRAT',label:'Contrat'},
              {value:'ATTESTATION_FT',label:'Attestation France Travail'},{value:'ATTESTATION_CAF',label:'Attestation CAF'}
            ]} />
          <Input label="Nom du fichier" name="nomDocument" value={documentForm.nomDocument} onChange={(e: any) => setDocumentForm({...documentForm, [e.target.name]: e.target.value})} />
          <Input label="Date d'expiration" name="dateExpiration" type="date" value={documentForm.dateExpiration} onChange={(e: any) => setDocumentForm({...documentForm, [e.target.name]: e.target.value})} />
          <div
            className={`p-8 border-2 border-dashed ${documentForm.file ? 'border-green-500 bg-green-500/10' : 'border-slate-500'} rounded-lg text-center cursor-pointer hover:border-blue-500 transition-colors`}
            onClick={() => document.getElementById('document-file-input')?.click()}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const file = e.dataTransfer.files[0];
              if (file) {
                setDocumentForm({...documentForm, file, nomDocument: documentForm.nomDocument || file.name});
              }
            }}
          >
            <input
              id="document-file-input"
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setDocumentForm({...documentForm, file, nomDocument: documentForm.nomDocument || file.name});
                }
              }}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />
            <Upload className={`w-8 h-8 mx-auto mb-2 ${documentForm.file ? 'text-green-500' : 'text-slate-400'}`} />
            {documentForm.file ? (
              <p className="text-sm text-green-500 font-medium">{documentForm.file.name}</p>
            ) : (
              <p className={`text-sm ${text('text-slate-400', 'text-gray-500')}`}>Glisser-déposer ou cliquer pour sélectionner</p>
            )}
          </div>
        </div>
      </Modal>

      <Modal show={showContratModal} onClose={() => setShowContratModal(false)} title="Nouveau contrat" onSave={saveContrat} saving={saving}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Type" name="typeContrat" type="select" value={contratForm.typeContrat} onChange={(e: any) => setContratForm({...contratForm, [e.target.name]: e.target.value})} options={[{value:'CDDI',label:'CDDI'},{value:'CDD',label:'CDD'}]} required />
            <Input label="Motif" name="motif" type="select" value={contratForm.motif} onChange={(e: any) => setContratForm({...contratForm, [e.target.name]: e.target.value})} options={[{value:'Initial',label:'Initial'},{value:'Renouvellement',label:'Renouvellement'}]} />
            <Input label="Date début" name="dateDebut" type="date" value={contratForm.dateDebut} onChange={(e: any) => setContratForm({...contratForm, [e.target.name]: e.target.value})} required />
            <Input label="Date fin" name="dateFin" type="date" value={contratForm.dateFin} onChange={(e: any) => setContratForm({...contratForm, [e.target.name]: e.target.value})} required />
            <Input label="Heures/semaine" name="dureeHeures" type="number" value={contratForm.dureeHeures} onChange={(e: any) => setContratForm({...contratForm, [e.target.name]: e.target.value})} />
            <Input label="N° DPAE" name="dpaeNumero" value={contratForm.dpaeNumero} onChange={(e: any) => setContratForm({...contratForm, [e.target.name]: e.target.value})} />
            <Input label="Date DPAE" name="dpaeDate" type="date" value={contratForm.dpaeDate} onChange={(e: any) => setContratForm({...contratForm, [e.target.name]: e.target.value})} />
          </div>
        </div>
      </Modal>

      <Modal show={showAvertissementModal} onClose={() => setShowAvertissementModal(false)} title="Nouvel avertissement" onSave={saveAvertissement} saving={saving}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date" name="dateAvertissement" type="date" value={avertissementForm.dateAvertissement} onChange={(e: any) => setAvertissementForm({...avertissementForm, [e.target.name]: e.target.value})} required />
            <Input label="Type" name="type" type="select" value={avertissementForm.type} onChange={(e: any) => setAvertissementForm({...avertissementForm, [e.target.name]: e.target.value})} options={[{value:'Verbal',label:'Verbal'},{value:'Écrit',label:'Écrit'},{value:'Mise à pied',label:'Mise à pied'}]} required />
          </div>
          <Input label="Motif" name="motif" type="textarea" value={avertissementForm.motif} onChange={(e: any) => setAvertissementForm({...avertissementForm, [e.target.name]: e.target.value})} required />
          <Input label="Description" name="description" type="textarea" value={avertissementForm.description} onChange={(e: any) => setAvertissementForm({...avertissementForm, [e.target.name]: e.target.value})} />
        </div>
      </Modal>

      <Modal show={showObjectifModal} onClose={() => { setShowObjectifModal(false); setObjectifForm({}); setEditingObjectifId(null); }} title={editingObjectifId ? "Modifier l'objectif" : "Nouvel objectif"} onSave={saveObjectifIndividuel} saving={saving}>
        <div className="space-y-4">
          <Input label="Titre de l'objectif" name="titre" value={objectifForm.titre || ''} onChange={(e: any) => setObjectifForm({...objectifForm, [e.target.name]: e.target.value})} required placeholder="Ex: Obtenir le permis B" />
          <Input label="Description" name="description" type="textarea" value={objectifForm.description || ''} onChange={(e: any) => setObjectifForm({...objectifForm, [e.target.name]: e.target.value})} placeholder="Détails de l'objectif..." />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Catégorie" name="categorie" type="select" value={objectifForm.categorie || 'emploi'} onChange={(e: any) => setObjectifForm({...objectifForm, [e.target.name]: e.target.value})} options={[{value:'emploi',label:'Emploi'},{value:'formation',label:'Formation'},{value:'administratif',label:'Administratif'},{value:'social',label:'Social'},{value:'personnel',label:'Personnel'}]} />
            <Input label="Priorité" name="priorite" type="select" value={objectifForm.priorite || 'normale'} onChange={(e: any) => setObjectifForm({...objectifForm, [e.target.name]: e.target.value})} options={[{value:'basse',label:'Basse'},{value:'normale',label:'Normale'},{value:'haute',label:'Haute'},{value:'critique',label:'Critique'}]} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Échéance" name="dateEcheance" type="date" value={objectifForm.dateEcheance?.split('T')[0] || ''} onChange={(e: any) => setObjectifForm({...objectifForm, [e.target.name]: e.target.value})} />
            <Input label="Points attribués" name="pointsAttribues" type="number" value={objectifForm.pointsAttribues || 5} onChange={(e: any) => setObjectifForm({...objectifForm, [e.target.name]: parseInt(e.target.value) || 0})} />
          </div>
          {editingObjectifId && (
            <div className="grid grid-cols-2 gap-4">
              <Input label="Statut" name="statut" type="select" value={objectifForm.statut || 'en_cours'} onChange={(e: any) => setObjectifForm({...objectifForm, [e.target.name]: e.target.value})} options={[{value:'en_cours',label:'En cours'},{value:'atteint',label:'Atteint'},{value:'abandonne',label:'Abandonné'},{value:'reporte',label:'Reporté'}]} />
              <Input label="Progression (%)" name="progression" type="number" value={objectifForm.progression || 0} onChange={(e: any) => setObjectifForm({...objectifForm, [e.target.name]: parseInt(e.target.value) || 0})} />
            </div>
          )}
          <Input label="Notes" name="notes" type="textarea" value={objectifForm.notes || ''} onChange={(e: any) => setObjectifForm({...objectifForm, [e.target.name]: e.target.value})} placeholder="Notes additionnelles..." />
        </div>
      </Modal>
    </div>
    </ThemeContext.Provider>
  );
}
