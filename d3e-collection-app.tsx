import React, { useState, useEffect } from 'react';
import {
  FileText,
  Clipboard,
  FileSpreadsheet,
  Truck,
  Package,
  BarChart3,
  MapPin,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Plus,
  Download,
  QrCode,
  FileEdit,
  TrendingUp,
  Weight,
  Euro,
  Users,
  Home,
  ChevronRight,
  Bell,
  Settings,
  X,
  Save,
  Building2,
  Phone,
  Mail,
  MapPinned,
  Sun,
  Moon,
  Monitor,
  Upload,
  File,
  Image,
  FileImage,
  FileType,
  Eye,
  Trash2,
  Info,
  Repeat,
  Layers,
  Split,
  Maximize2,
  Recycle,
  Leaf,
  ChevronDown,
  ShoppingCart,
  Store,
  DollarSign,
  Award,
  List,
  ShoppingBag,
  Grid3x3,
  FileCheck,
  UserCheck,
  Sparkles,
  Key,
  Loader2,
  Wrench,
  ChevronUp,
  Shield,
  AlertTriangle,
  Briefcase,
} from 'lucide-react';
import { pickupRequestsApi, lotsApi } from './src/services/api';
import dismantlingConfigData from './dementellement.json';
import D3EDocGenerator from './D3EDocGenerator';
import AIConversationWidget from './AIConversationWidget';

// Types et interfaces
interface CaseFile {
  id: string;
  reference: string;
  client: string;
  site: string;
  status: 'diagnostic_pending' | 'quote_pending' | 'quote_approved' | 'in_collection' | 'in_progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
  estimatedWeight: number;
  realWeight: number;
  estimatedValue: number;
  valeurEstimee?: number;
  valeurRevente?: number;
  createdAt: string;
  collectionDate?: string;
  notifications: number;
  inventory?: any[]; // Inventaire pour le filtrage
}

interface Lot {
  id: string;
  code: string;
  category: string;
  grade: 'A' | 'B' | 'C' | 'D';
  orientation: 'resale' | 'refurbishment' | 'dismantling' | 'waste';
  estimatedWeight: number;
  realWeight?: number;
  status: string;
  qrCode: string;
}

interface QuotationLine {
  id: string;
  type: 'service' | 'material' | 'package';
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  total: number;
}

interface TransportOrder {
  id: string;
  type: string;
  transporter: string;
  vehicle: string;
  driver: string;
  status: 'planned' | 'in_progress' | 'completed' | 'delayed';
  plannedDate: string;
  documents: string[];
}

interface RequestFormData {
  clientName: string;
  siteName: string;
  siteAddress: string;
  contactName: string;
  contactFunction: string;
  contactPhone: string;
  contactEmail: string;
  description: string;
  mainCategory: string;
  estimatedVolume: string;
  valeurEstimee: string;
  valeurRevente: string;
  priority: 'high' | 'medium' | 'low';
  plannedVisitDate: string;
  accessNotes: string;
}

type ThemeMode = 'light' | 'dark' | 'auto';

const D3ECollectionApp = () => {
  // États principaux
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedCaseFile, setSelectedCaseFile] = useState<string>('CF-2025-001');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isRequestPanelOpen, setIsRequestPanelOpen] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [activeMenu, setActiveMenu] = useState<'dashboard' | 'requests' | 'sales' | 'warehouse' | 'hr'>('requests');
  const [mediaSubTab, setMediaSubTab] = useState<'gallery' | 'internal-docs' | 'client-docs' | 'auto-generation'>('gallery');

  // États pour AI Recognition
  const [isAIRecognitionOpen, setIsAIRecognitionOpen] = useState<boolean>(false);
  const [aiApiKey, setAiApiKey] = useState<string>(() => localStorage.getItem('openai_api_key') || '');
  const [aiModel, setAiModel] = useState<string>(() => localStorage.getItem('openai_model') || 'gpt-4o-mini');
  const [aiAnalyzing, setAiAnalyzing] = useState<boolean>(false);
  const [aiResults, setAiResults] = useState<any>(null);
  const [selectedImageForAI, setSelectedImageForAI] = useState<string>('');
  const [aiConfigured, setAiConfigured] = useState<boolean>(() => !!localStorage.getItem('openai_api_key'));

  // États pour les utilisateurs assignés
  const [users, setUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false);

  // État du thème
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('themeMode');
    return (saved as ThemeMode) || 'auto';
  });
  const [isDark, setIsDark] = useState<boolean>(true);

  const [formData, setFormData] = useState<RequestFormData>({
    clientName: '',
    siteName: '',
    siteAddress: '',
    contactName: '',
    contactFunction: '',
    contactPhone: '',
    contactEmail: '',
    description: '',
    mainCategory: 'informatique',
    estimatedVolume: '',
    valeurEstimee: '',
    valeurRevente: '',
    priority: 'medium',
    plannedVisitDate: '',
    accessNotes: '',
  });

  // État des statistiques de ventes
  const [salesStats, setSalesStats] = useState<any>(null);
  const [salesLoading, setSalesLoading] = useState<boolean>(false);
  const [salesPeriod, setSalesPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [salesTimeframe, setSalesTimeframe] = useState<'current' | 'previous'>('current');
  const [salesCaseFiles, setSalesCaseFiles] = useState<any[]>([]); // Liste des demandes avec ventes
  const [selectedSaleCaseFile, setSelectedSaleCaseFile] = useState<string | null>(null); // Demande sélectionnée
  const [salesListLoading, setSalesListLoading] = useState<boolean>(false);
  const [caseFileSales, setCaseFileSales] = useState<any[]>([]); // Ventes de la demande sélectionnée
  const [salesView, setSalesView] = useState<'dashboard' | 'list'>('list'); // Vue active (dashboard ou liste)
  const [top5SortBy, setTop5SortBy] = useState<'value' | 'percentage'>('value'); // Type de tri pour Top 5

  // États pour le Dashboard RH
  const [hrPersonnel, setHrPersonnel] = useState<any[]>([]);
  const [hrStats, setHrStats] = useState<any>(null);
  const [isLoadingHrPersonnel, setIsLoadingHrPersonnel] = useState<boolean>(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userSearchTerm, setUserSearchTerm] = useState<string>('');
  const [userFilterRole, setUserFilterRole] = useState<string>('all');
  const [userPanelTab, setUserPanelTab] = useState<'general' | 'contrat' | 'absences' | 'missions'>('general');
  const [userFormData, setUserFormData] = useState({
    // Informations générales
    nom: '',
    email: '',
    role: 'technicien',
    actif: true,
    telephone: '',
    adresse: '',
    dateNaissance: '',
    lieuNaissance: '',
    numeroSecu: '',

    // Contrat
    typeContrat: 'CDI',
    dateDebut: '',
    dateFin: '',
    poste: '',
    salaireBrut: '',
    heuresHebdo: '35',
    conventionCollective: '',
    coefficient: '',
    classification: '',
    periodeEssai: '',
    anciennete: '',
  });

  // États pour la gestion des lots et composants
  const [isLotModalOpen, setIsLotModalOpen] = useState<boolean>(false);
  const [lotFormData, setLotFormData] = useState({
    categorie: '',
    grade: 'A',
    orientation: 'recyclage',
    poidsEstime: '',
    notes: '',
  });
  const [lotComponents, setLotComponents] = useState<any[]>([]);
  const [isAddingComponent, setIsAddingComponent] = useState<boolean>(false);
  const [componentFormData, setComponentFormData] = useState({
    type: '',
    marque: '',
    modele: '',
    numeroSerie: '',
    etat: 'fonctionnel',
    notes: '',
  });

  // Fonction pour déterminer le thème basé sur l'heure (mode auto)
  const isNightTime = () => {
    const hour = new Date().getHours();
    // Nuit entre 19h et 7h
    return hour >= 19 || hour < 7;
  };

  // Effet pour gérer le thème
  useEffect(() => {
    const updateTheme = () => {
      let shouldBeDark = true;

      if (themeMode === 'light') {
        shouldBeDark = false;
      } else if (themeMode === 'dark') {
        shouldBeDark = true;
      } else if (themeMode === 'auto') {
        shouldBeDark = isNightTime();
      }

      setIsDark(shouldBeDark);
      localStorage.setItem('themeMode', themeMode);
    };

    updateTheme();

    // Si mode auto, vérifier toutes les minutes pour mettre à jour le thème
    if (themeMode === 'auto') {
      const interval = setInterval(updateTheme, 60000); // Vérifier chaque minute
      return () => clearInterval(interval);
    }
  }, [themeMode]);

  // Effet pour charger les statistiques de ventes
  useEffect(() => {
    const fetchSalesStats = async () => {
      if (activeMenu !== 'sales') return;

      setSalesLoading(true);
      try {
        // Calculer les dates de début et fin selon la période et le timeframe
        const now = new Date();
        let dateDebut = new Date();
        let dateFin = new Date();

        if (salesTimeframe === 'current') {
          // Période en cours
          if (salesPeriod === 'week') {
            const dayOfWeek = now.getDay();
            const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Lundi = 0
            dateDebut = new Date(now);
            dateDebut.setDate(now.getDate() - diff);
            dateDebut.setHours(0, 0, 0, 0);
            dateFin = new Date(now);
            dateFin.setHours(23, 59, 59, 999);
          } else if (salesPeriod === 'month') {
            dateDebut = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
            dateFin = new Date(now);
            dateFin.setHours(23, 59, 59, 999);
          } else if (salesPeriod === 'year') {
            dateDebut = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
            dateFin = new Date(now);
            dateFin.setHours(23, 59, 59, 999);
          }
        } else {
          // Période précédente
          if (salesPeriod === 'week') {
            const dayOfWeek = now.getDay();
            const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            dateDebut = new Date(now);
            dateDebut.setDate(now.getDate() - diff - 7);
            dateDebut.setHours(0, 0, 0, 0);
            dateFin = new Date(dateDebut);
            dateFin.setDate(dateDebut.getDate() + 6);
            dateFin.setHours(23, 59, 59, 999);
          } else if (salesPeriod === 'month') {
            dateDebut = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
            dateFin = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
          } else if (salesPeriod === 'year') {
            dateDebut = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
            dateFin = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
          }
        }

        const params = new URLSearchParams({
          dateDebut: dateDebut.toISOString(),
          dateFin: dateFin.toISOString(),
        });

        const response = await fetch(`https://valotik-api-546691893264.europe-west1.run.app/api/sales/stats?${params}`);
        if (response.ok) {
          const data = await response.json();
          setSalesStats(data.data);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques de ventes:', error);
      } finally {
        setSalesLoading(false);
      }
    };

    fetchSalesStats();
  }, [activeMenu, salesPeriod, salesTimeframe]);

  // Effet pour charger la liste des demandes avec ventes
  useEffect(() => {
    const fetchSalesCaseFiles = async () => {
      if (activeMenu !== 'sales') return;

      setSalesListLoading(true);
      try {
        // Calculer les dates de début et fin selon la période et le timeframe
        const now = new Date();
        let dateDebut = new Date();
        let dateFin = new Date();

        if (salesTimeframe === 'current') {
          if (salesPeriod === 'week') {
            const dayOfWeek = now.getDay();
            const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            dateDebut = new Date(now);
            dateDebut.setDate(now.getDate() - diff);
            dateDebut.setHours(0, 0, 0, 0);
            dateFin = new Date(now);
            dateFin.setHours(23, 59, 59, 999);
          } else if (salesPeriod === 'month') {
            dateDebut = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
            dateFin = new Date(now);
            dateFin.setHours(23, 59, 59, 999);
          } else if (salesPeriod === 'year') {
            dateDebut = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
            dateFin = new Date(now);
            dateFin.setHours(23, 59, 59, 999);
          }
        } else {
          if (salesPeriod === 'week') {
            const dayOfWeek = now.getDay();
            const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            dateDebut = new Date(now);
            dateDebut.setDate(now.getDate() - diff - 7);
            dateDebut.setHours(0, 0, 0, 0);
            dateFin = new Date(dateDebut);
            dateFin.setDate(dateDebut.getDate() + 6);
            dateFin.setHours(23, 59, 59, 999);
          } else if (salesPeriod === 'month') {
            dateDebut = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
            dateFin = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
          } else if (salesPeriod === 'year') {
            dateDebut = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
            dateFin = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
          }
        }

        const params = new URLSearchParams({
          dateDebut: dateDebut.toISOString(),
          dateFin: dateFin.toISOString(),
        });

        const response = await fetch(`https://valotik-api-546691893264.europe-west1.run.app/api/sales/case-files?${params}`);
        if (response.ok) {
          const data = await response.json();
          setSalesCaseFiles(data.data || []);
          // Ne pas auto-sélectionner la première demande - afficher le dashboard par défaut
        }
      } catch (error) {
        console.error('Erreur lors du chargement des demandes avec ventes:', error);
      } finally {
        setSalesListLoading(false);
      }
    };

    fetchSalesCaseFiles();
  }, [activeMenu, salesPeriod, salesTimeframe]);

  // Effet pour charger les dossiers (case files)
  useEffect(() => {
    const fetchCaseFiles = async () => {
      if (activeMenu !== 'requests') {
        return;
      }

      setIsLoadingCaseFiles(true);
      try {
        const response = await fetch('https://valotik-api-546691893264.europe-west1.run.app/api/case-files');
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data?.caseFiles) {
            // Transformer les données de l'API vers le format attendu par l'interface
            const transformedCaseFiles = result.data.caseFiles.map((cf: any) => ({
              id: cf.id,
              reference: cf.reference,
              client: cf.request?.client?.raisonSociale || 'Client inconnu',
              site: cf.request?.site?.nom || 'Site inconnu',
              status: cf.statut,
              priority: cf.request?.priorite || 'medium',
              estimatedWeight: cf.poidsEstime || 0,
              realWeight: cf.poidsReel || 0,
              estimatedValue: cf.valeurTotale || 0,
              valeurEstimee: cf.request?.valeurEstimee,
              valeurRevente: cf.request?.valeurRevente,
              createdAt: cf.createdAt,
              collectionDate: cf.request?.plannedVisitAt,
              notifications: 0,
              inventory: cf.lots || [],
            }));
            setCaseFiles(transformedCaseFiles);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des dossiers:', error);
      } finally {
        setIsLoadingCaseFiles(false);
      }
    };

    fetchCaseFiles();
  }, [activeMenu]);

  // Effet pour charger les ventes d'une demande sélectionnée
  useEffect(() => {
    const fetchCaseFileSales = async () => {
      if (!selectedSaleCaseFile) {
        setCaseFileSales([]);
        return;
      }

      try {
        // Calculer les mêmes dates que pour la liste des demandes
        const now = new Date();
        let dateDebut = new Date();
        let dateFin = new Date();

        if (salesTimeframe === 'current') {
          if (salesPeriod === 'week') {
            const dayOfWeek = now.getDay();
            const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            dateDebut = new Date(now);
            dateDebut.setDate(now.getDate() - diff);
            dateDebut.setHours(0, 0, 0, 0);
            dateFin = new Date(now);
            dateFin.setHours(23, 59, 59, 999);
          } else if (salesPeriod === 'month') {
            dateDebut = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
            dateFin = new Date(now);
            dateFin.setHours(23, 59, 59, 999);
          } else if (salesPeriod === 'year') {
            dateDebut = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
            dateFin = new Date(now);
            dateFin.setHours(23, 59, 59, 999);
          }
        } else {
          if (salesPeriod === 'week') {
            const dayOfWeek = now.getDay();
            const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            dateDebut = new Date(now);
            dateDebut.setDate(now.getDate() - diff - 7);
            dateDebut.setHours(0, 0, 0, 0);
            dateFin = new Date(dateDebut);
            dateFin.setDate(dateDebut.getDate() + 6);
            dateFin.setHours(23, 59, 59, 999);
          } else if (salesPeriod === 'month') {
            dateDebut = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
            dateFin = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
          } else if (salesPeriod === 'year') {
            dateDebut = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
            dateFin = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
          }
        }

        const params = new URLSearchParams({
          caseFileId: selectedSaleCaseFile,
          dateDebut: dateDebut.toISOString(),
          dateFin: dateFin.toISOString(),
        });

        const response = await fetch(`https://valotik-api-546691893264.europe-west1.run.app/api/sales?${params}`);
        if (response.ok) {
          const data = await response.json();
          setCaseFileSales(data.data.sales || []);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des ventes:', error);
      }
    };

    fetchCaseFileSales();
  }, [selectedSaleCaseFile, salesPeriod, salesTimeframe]);

  // Effet pour charger les utilisateurs et stats RH
  useEffect(() => {
    const fetchUsers = async () => {
      if (activeMenu !== 'hr') {
        return;
      }

      setIsLoadingHrPersonnel(true);
      try {
        // Charger les utilisateurs et les stats en parallèle
        const [usersResponse, statsResponse] = await Promise.all([
          fetch('https://valotik-api-546691893264.europe-west1.run.app/api/users'),
          fetch('https://valotik-api-546691893264.europe-west1.run.app/api/users/statistics')
        ]);

        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setHrPersonnel(usersData.data.users || []);
        }

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setHrStats(statsData.data);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
      } finally {
        setIsLoadingHrPersonnel(false);
      }
    };

    fetchUsers();
  }, [activeMenu]);

  // Fonction pour changer de thème
  const cycleTheme = () => {
    setThemeMode((prev) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'auto';
      return 'light';
    });
  };

  // Fonction helper pour les classes de thème
  const bg = (darkClass: string, lightClass: string) => isDark ? darkClass : lightClass;
  const text = (darkClass: string, lightClass: string) => isDark ? darkClass : lightClass;
  const border = (darkClass: string, lightClass: string) => isDark ? darkClass : lightClass;

  // Classes préfabriquées pour les composants courants
  const cardClasses = `${bg('bg-slate-800/50', 'bg-white')} ${border('border-slate-700', 'border-gray-200')} border rounded-lg p-6`;
  const cardBgClasses = bg('bg-slate-800/50', 'bg-white');
  const cardBorderClasses = border('border-slate-700', 'border-gray-200');
  const inputClasses = `${bg('bg-slate-800', 'bg-gray-50')} ${border('border-slate-700', 'border-gray-300')} ${text('text-white', 'text-gray-900')} ${text('placeholder-slate-500', 'placeholder-gray-500')}`;
  const headingClasses = text('text-white', 'text-gray-900');
  const subTextClasses = text('text-slate-400', 'text-gray-600');
  const mutedTextClasses = text('text-slate-500', 'text-gray-500');

  // Obtenir l'icône du thème actuel
  const getThemeIcon = () => {
    if (themeMode === 'light') return Sun;
    if (themeMode === 'dark') return Moon;
    return Monitor;
  };

  const getThemeLabel = () => {
    if (themeMode === 'light') return 'Clair';
    if (themeMode === 'dark') return 'Sombre';
    return 'Auto';
  };

  const ThemeIcon = getThemeIcon();

  // État pour les dossiers chargés depuis l'API
  const [caseFiles, setCaseFiles] = useState<CaseFile[]>([]);
  const [isLoadingCaseFiles, setIsLoadingCaseFiles] = useState<boolean>(true);

  // État pour les détails du dossier sélectionné
  const [selectedCaseFileDetails, setSelectedCaseFileDetails] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);

  // Fonction pour charger les détails d'un dossier (accessible depuis n'importe où)
  const loadCaseFileDetails = async (caseFileId: string) => {
    if (!caseFileId) return;

    try {
      setIsLoadingDetails(true);

      const response = await fetch(`https://valotik-api-546691893264.europe-west1.run.app/api/case-files/${caseFileId}`);
      const result = await response.json();

      if (result.success && result.data) {
        const detailsWithPhotos = { ...result.data };
        if (!detailsWithPhotos.documents) {
          detailsWithPhotos.documents = [];
        }

        const allPhotos = detailsWithPhotos.documents.filter((d: any) => d.type === 'photo' || d.type === 'image');
        const demoPhotos = allPhotos.filter((d: any) => d.id && d.id.startsWith('demo-photo-'));
        const realPhotos = allPhotos.filter((d: any) => !d.id || !d.id.startsWith('demo-photo-'));

        if (demoPhotos.length === 0) {
          const photoPool = [
            { nom: 'Ordinateurs portables professionnels.jpg', url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&h=800&fit=crop', taille: 245000 },
            { nom: 'Pile de moniteurs LCD à recycler.jpg', url: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=800&h=600&fit=crop', taille: 389000 },
            { nom: 'Tour PC et unités centrales.jpg', url: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=700&h=700&fit=crop', taille: 312000 },
            { nom: 'Ordinateurs de bureau Dell OptiPlex.jpg', url: 'https://images.unsplash.com/photo-1593642532400-2682810df593?w=900&h=600&fit=crop', taille: 423000 },
            { nom: 'Écrans plats et moniteurs professionnels.jpg', url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=650&h=850&fit=crop', taille: 378000 },
            { nom: 'Stations de travail et postes fixes.jpg', url: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=700&h=700&fit=crop', taille: 298000 },
            { nom: 'Bureau exécutif en bois massif.jpg', url: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=900&h=600&fit=crop', taille: 478000 },
            { nom: 'Chaises de bureau ergonomiques.jpg', url: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=600&h=800&fit=crop', taille: 223000 },
            { nom: 'Table de conférence et mobilier salle réunion.jpg', url: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1000&h=600&fit=crop', taille: 567000 },
            { nom: 'Armoires de rangement métalliques.jpg', url: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=750&h=750&fit=crop', taille: 398000 },
            { nom: 'Petit mobilier et caissons.jpg', url: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=700&h=700&fit=crop', taille: 278000 },
            { nom: 'Tables de bureau modulaires.jpg', url: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&h=550&fit=crop', taille: 345000 },
            { nom: 'Fauteuils de direction en cuir.jpg', url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=900&fit=crop', taille: 412000 },
            { nom: 'Claviers et périphériques informatiques.jpg', url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&h=900&fit=crop', taille: 256000 },
            { nom: 'Smartphones et tablettes professionnels.jpg', url: 'https://images.unsplash.com/photo-1583573703417-a78ed127f00b?w=650&h=650&fit=crop', taille: 145000 },
            { nom: 'Câbles et accessoires électroniques.jpg', url: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=800&h=600&fit=crop', taille: 189000 },
            { nom: 'Téléphones fixes et équipements télécoms.jpg', url: 'https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=650&h=900&fit=crop', taille: 234000 },
            { nom: 'Souris et accessoires sans fil.jpg', url: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=750&h=750&fit=crop', taille: 167000 },
            { nom: 'Imprimantes et photocopieuses professionnelles.jpg', url: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=700&h=500&fit=crop', taille: 334000 },
            { nom: 'Scanners et équipements numérisation.jpg', url: 'https://images.unsplash.com/photo-1590859808308-3d2d9c515b1a?w=600&h=800&fit=crop', taille: 289000 },
            { nom: 'Destructeurs de documents et accessoires.jpg', url: 'https://images.unsplash.com/photo-1544396821-4dd40b938ad3?w=700&h=700&fit=crop', taille: 198000 },
            { nom: 'Serveurs et équipements réseau.jpg', url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=850&fit=crop', taille: 456000 },
            { nom: 'Switchs et routeurs professionnels.jpg', url: 'https://images.unsplash.com/photo-1581092918484-8313e1f7e8c6?w=800&h=600&fit=crop', taille: 367000 },
            { nom: 'Équipements télécommunications.jpg', url: 'https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=650&h=850&fit=crop', taille: 401000 },
            { nom: 'Lampes et éclairage de bureau.jpg', url: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=900&h=650&fit=crop', taille: 312000 },
            { nom: 'Néons et éclairage suspendu.jpg', url: 'https://images.unsplash.com/photo-1565814636199-ae8133055c1c?w=750&h=750&fit=crop', taille: 276000 },
            { nom: 'Ventilateurs et climatisation mobile.jpg', url: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=700&h=900&fit=crop', taille: 334000 },
            { nom: 'Tableau blanc et équipements présentation.jpg', url: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800&h=600&fit=crop', taille: 289000 },
            { nom: 'Onduleurs et équipements électriques.jpg', url: 'https://images.unsplash.com/photo-1517420879524-86d64ac2f339?w=650&h=650&fit=crop', taille: 245000 },
            { nom: 'Casques audio et équipements son.jpg', url: 'https://images.unsplash.com/photo-1545127398-14699f92334b?w=600&h=800&fit=crop', taille: 198000 },
          ];

          const hashCode = (str: string) => {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
              const char = str.charCodeAt(i);
              hash = ((hash << 5) - hash) + char;
              hash = hash & hash;
            }
            return Math.abs(hash);
          };

          const seed = hashCode(caseFileId);
          const selectedPhotos = [];
          const usedIndices = new Set();
          const photoCount = 12 + (seed % 7);

          for (let i = 0; i < photoCount && selectedPhotos.length < photoPool.length; i++) {
            let index = (seed + i * 7) % photoPool.length;
            while (usedIndices.has(index)) {
              index = (index + 1) % photoPool.length;
            }
            usedIndices.add(index);
            const photo = photoPool[index];
            const dayOffset = Math.floor(i / 3);

            selectedPhotos.push({
              id: `demo-photo-${caseFileId}-${i + 1}`,
              caseFileId: caseFileId,
              type: 'photo',
              nomFichier: photo.nom,
              url: photo.url,
              taille: photo.taille,
              createdAt: new Date(Date.now() - dayOffset * 24 * 60 * 60 * 1000).toISOString(),
            });
          }

          detailsWithPhotos.documents = [...selectedPhotos, ...detailsWithPhotos.documents];
        }

        setSelectedCaseFileDetails(detailsWithPhotos);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des détails du dossier:', error);
      // Fallback avec photos de démo (code réduit pour éviter la duplication)
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Fonctions AI Recognition
  const saveAIConfig = () => {
    if (!aiApiKey.trim()) {
      alert('Veuillez entrer une clé API OpenAI valide');
      return;
    }
    localStorage.setItem('openai_api_key', aiApiKey);
    localStorage.setItem('openai_model', aiModel);
    setAiConfigured(true);
  };

  const analyzeImageWithAI = async (imageUrl: string) => {
    if (!aiApiKey || !imageUrl) {
      alert('Configuration API manquante ou image non sélectionnée');
      return;
    }

    setAiAnalyzing(true);
    setAiResults(null);

    try {
      // Convertir l'URL de l'image en base64 si nécessaire
      let base64Image = imageUrl;
      if (!imageUrl.startsWith('data:')) {
        // Si c'est une URL serveur, on la charge en base64
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        base64Image = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }

      const apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiApiKey}`
        },
        body: JSON.stringify({
          model: aiModel,
          messages: [
            {
              role: "system",
              content: `Tu es un agent qui détecte des images de matériel à recycler: matériel D3E, matériel informatique, mobilier de bureau que l'on prend en photo dans des entreprises qui veulent se débarrasser de leur matériel et le recycler.

Analyse l'image et réponds UNIQUEMENT au format JSON suivant (sans texte avant ou après):
{
  "category": "informatique|electrique|mobilier",
  "subcategory": "sous-catégorie exacte",
  "product": "Nom/modèle du produit",
  "description": "Description détaillée pour vente en ligne (150-200 mots), incluant caractéristiques, état, utilisation recommandée",
  "condition": "Excellent état|Très bon état|Bon état|État correct|Usagé",
  "estimatedPrice": "Fourchette de prix estimé en euros (ex: 150-200€)",
  "material": "Matériaux principaux",
  "dimensions": "Dimensions estimées si pertinent"
}

Catégories disponibles:
- informatique: Ordinateurs portables, Ordinateurs de bureau, Écrans, Claviers, Souris, Imprimantes, Scanners, Serveurs, Composants PC, Accessoires informatiques
- electrique: Multiprises, Câbles d'alimentation, Adaptateurs, Onduleurs, Lampes de bureau, Ventilateurs, Chauffages, Rallonges électriques
- mobilier: Bureaux, Chaises de bureau, Fauteuils, Armoires, Étagères, Caissons, Tables de réunion, Cloisons, Rangements`
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Analyse ce matériel de bureau et fournis les informations au format JSON demandé."
                },
                {
                  type: "image_url",
                  image_url: {
                    url: base64Image
                  }
                }
              ]
            }
          ],
          max_tokens: 1000,
          temperature: 0.3
        })
      });

      if (!apiResponse.ok) {
        const error = await apiResponse.json();
        throw new Error(error.error?.message || 'Erreur API OpenAI');
      }

      const data = await apiResponse.json();
      const content = data.choices[0].message.content;

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Format de réponse invalide');

      const result = JSON.parse(jsonMatch[0]);
      setAiResults(result);
    } catch (error: any) {
      alert(`Erreur lors de l'analyse: ${error.message}`);
    } finally {
      setAiAnalyzing(false);
    }
  };

  const openAIRecognitionWithImage = (imageUrl: string) => {
    setSelectedImageForAI(imageUrl);
    setIsAIRecognitionOpen(true);
    setAiResults(null);
  };

  // Fonctions pour la Checklist IA de Démontage
  const generateDismantlingChecklist = (data: any) => {
    const steps: any[] = [];
    let stepNumber = 1;
    const categoryName = (data.category || '').toLowerCase();
    const isFurniture = categoryName.includes('mobilier') || categoryName.includes('meuble');

    // Étape 1: Préparation et sécurité
    steps.push({
      step: stepNumber++,
      action: isFurniture
        ? "Préparation de l'espace de travail et vérification des outils de démontage mobilier"
        : "Préparation de l'espace de travail et vérification des EPI",
      tools: isFurniture
        ? ["Clé Allen", "Tournevis", "Marteau", "Conteneurs de tri"]
        : ["Tapis antistatique", "Conteneurs de tri"],
      EPI: ["Gants de protection", "Lunettes de sécurité"],
      estimated_time_min: 3,
      output_stream: "preparation",
      eco_value: 0,
      priority: "high"
    });

    // Étape 2: Déconnexion et décharge
    if (data.components.some((c: any) => c.type.includes("batterie"))) {
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
    if (data.components.some((c: any) => c.type.includes("batterie"))) {
      const battery = data.components.find((c: any) => c.type.includes("batterie"));
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
    if (data.components.some((c: any) => c.type.includes("ecran"))) {
      const screen = data.components.find((c: any) => c.type.includes("ecran"));
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
    if (data.components.some((c: any) => c.type.includes("carte-mere") || c.type.includes("disque"))) {
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
    if (data.components.some((c: any) => c.type.includes("carte-mere"))) {
      const pcb = data.components.find((c: any) => c.type.includes("carte-mere"));
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
    if (data.components.some((c: any) => c.type.includes("cable"))) {
      const cables = data.components.find((c: any) => c.type.includes("cable"));
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
    if (data.components.some((c: any) => c.type.includes("clavier"))) {
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
    if (data.components.some((c: any) => c.type.includes("coque") || c.type.includes("plastique"))) {
      const plastics = data.components.filter((c: any) => c.material?.includes("plastique"));
      const totalPlastic = plastics.reduce((sum: number, p: any) => sum + p.weight, 0);
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

    // Étapes spécifiques au mobilier
    if (isFurniture) {
      // Démontage structures métalliques
      if (data.components.some((c: any) => c.type.includes("metal") || c.type.includes("acier"))) {
        const metals = data.components.find((c: any) => c.type.includes("metal"));
        steps.push({
          step: stepNumber++,
          action: "Démontage de la structure métallique - Dévisser les fixations et séparer les éléments",
          tools: ["Clé Allen", "Tournevis cruciforme", "Clé à molette"],
          EPI: ["Gants de protection", "Chaussures de sécurité"],
          estimated_time_min: 12,
          output_stream: "metaux-ferreux",
          eco_value: metals.weight * 8,
          priority: "high"
        });
      }

      // Démontage bois
      if (data.components.some((c: any) => c.type.includes("bois"))) {
        const wood = data.components.find((c: any) => c.type.includes("bois"));
        steps.push({
          step: stepNumber++,
          action: "Séparation des éléments en bois - Retirer les panneaux et plateaux",
          tools: ["Tournevis", "Pied de biche", "Marteau"],
          EPI: ["Gants", "Masque anti-poussière"],
          estimated_time_min: 10,
          output_stream: "bois-agglomere",
          eco_value: wood.weight * 4,
          priority: "medium"
        });
      }

      // Démontage verre
      if (data.components.some((c: any) => c.type.includes("verre"))) {
        steps.push({
          step: stepNumber++,
          action: "Retrait des éléments en verre (portes, plateaux) - Manipulation avec précaution",
          tools: ["Gants anti-coupure", "Ventouses"],
          EPI: ["Gants anti-coupure", "Lunettes de sécurité"],
          estimated_time_min: 8,
          output_stream: "verre-recyclable",
          eco_value: 15,
          priority: "critical"
        });
      }
    }

    // Étape finale: Tri final
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
    const totalWeight = data.components.reduce((sum: number, c: any) => sum + c.weight, 0);
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

  const handleGenerateChecklist = () => {
    try {
      let data;

      if (checklistJsonInput) {
        // Utiliser le JSON fourni par l'utilisateur
        data = JSON.parse(checklistJsonInput);
      } else if (selectedLotForDismantling) {
        // Générer les données à partir du lot sélectionné
        const lot = selectedLotForDismantling;
        const components = lot.components || [];

        // Mapper les composants du lot vers le format attendu
        const mappedComponents = components.map((comp: any) => {
          const componentName = (comp.nom || comp.name || '').toLowerCase();
          const componentWeight = comp.poids || comp.weight || 0.5;

          // Déterminer le type et matériau basé sur le nom
          let type = componentName;
          let material = 'mixte';

          if (componentName.includes('batterie') || componentName.includes('battery')) {
            type = 'batterie-lithium';
            material = 'lithium-ion';
          } else if (componentName.includes('écran') || componentName.includes('ecran') || componentName.includes('screen')) {
            type = 'ecran-lcd';
            material = 'verre-plastique';
          } else if (componentName.includes('carte') || componentName.includes('board')) {
            type = 'carte-mere';
            material = 'pcb-metaux';
          } else if (componentName.includes('disque') || componentName.includes('disk') || componentName.includes('ssd')) {
            type = 'disque-dur';
            material = 'metaux-plastique';
          } else if (componentName.includes('coque') || componentName.includes('boitier') || componentName.includes('plastique')) {
            type = 'coque-plastique';
            material = 'abs-polycarbonate';
          } else if (componentName.includes('clavier') || componentName.includes('keyboard')) {
            type = 'clavier';
            material = 'plastique-silicone';
          } else if (componentName.includes('cable') || componentName.includes('câble')) {
            type = 'cables-connecteurs';
            material = 'cuivre-plastique';
          } else if (componentName.includes('metal') || componentName.includes('métal') || componentName.includes('acier')) {
            type = 'structure-metal';
            material = 'acier-aluminium';
          } else if (componentName.includes('bois')) {
            type = 'structure-bois';
            material = 'bois-agglomere';
          } else if (componentName.includes('verre') || componentName.includes('vitre')) {
            type = 'verre';
            material = 'verre';
          }

          return {
            type,
            weight: componentWeight,
            material
          };
        });

        // Si pas de composants, ajouter des composants génériques basés sur la catégorie
        if (mappedComponents.length === 0) {
          const categoryName = (lot.categorieName || '').toLowerCase();

          if (categoryName.includes('informatique') || categoryName.includes('ordinateur')) {
            mappedComponents.push(
              { type: 'batterie-lithium', weight: 0.3, material: 'lithium-ion' },
              { type: 'ecran-lcd', weight: 0.5, material: 'verre-plastique' },
              { type: 'carte-mere', weight: 0.2, material: 'pcb-metaux' },
              { type: 'coque-plastique', weight: 0.8, material: 'abs-polycarbonate' }
            );
          } else if (categoryName.includes('mobilier') || categoryName.includes('meuble')) {
            mappedComponents.push(
              { type: 'structure-metal', weight: 5, material: 'acier-aluminium' },
              { type: 'structure-bois', weight: 8, material: 'bois-agglomere' },
              { type: 'coque-plastique', weight: 2, material: 'plastique-divers' }
            );
          } else {
            mappedComponents.push(
              { type: 'structure-metal', weight: 2, material: 'acier-aluminium' },
              { type: 'coque-plastique', weight: 1, material: 'plastique-divers' },
              { type: 'cables-connecteurs', weight: 0.5, material: 'cuivre-plastique' }
            );
          }
        }

        data = {
          category: lot.categorieName || 'equipements-divers',
          subcategory: lot.subcategory || 'general',
          components: mappedComponents
        };
      } else {
        // Fallback vers exemple par défaut
        data = {
          category: "equipements-informatiques",
          subcategory: "ordinateurs-portables",
          components: [
            { type: "batterie-lithium", weight: 0.3, material: "lithium-ion" },
            { type: "ecran-lcd", weight: 0.5, material: "verre-plastique" },
            { type: "carte-mere", weight: 0.2, material: "pcb-metaux" },
            { type: "coque-plastique", weight: 0.8, material: "abs-polycarbonate" }
          ]
        };
      }

      const result = generateDismantlingChecklist(data);
      setGeneratedChecklist(result);
      setCompletedChecklistSteps({});
    } catch (error: any) {
      alert("Erreur lors de la génération: " + error.message);
    }
  };

  const toggleChecklistStep = (stepNum: number) => {
    setExpandedChecklistSteps(prev => ({
      ...prev,
      [stepNum]: !prev[stepNum]
    }));
  };

  const toggleChecklistComplete = (stepNum: number) => {
    setCompletedChecklistSteps(prev => ({
      ...prev,
      [stepNum]: !prev[stepNum]
    }));
  };

  const getStreamColor = (stream: string) => {
    if (stream.includes('batterie')) return 'text-red-600';
    if (stream.includes('metaux')) return 'text-yellow-600';
    if (stream.includes('plastique')) return 'text-blue-600';
    if (stream.includes('reemploi')) return 'text-green-600';
    return 'text-gray-600';
  };

  // État pour les utilisateurs (intervenants)
  const [intervenants, setIntervenants] = useState<any[]>([]);
  const [isLoadingIntervenants, setIsLoadingIntervenants] = useState<boolean>(true);

  // États pour l'inventaire
  const [expandedLotId, setExpandedLotId] = useState<string | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<any>(null);
  const [isComponentPanelOpen, setIsComponentPanelOpen] = useState<boolean>(false);

  // États pour le démantèlement
  const [isDismantlingPanelOpen, setIsDismantlingPanelOpen] = useState<boolean>(false);
  const [selectedLotForDismantling, setSelectedLotForDismantling] = useState<any>(null);
  const [dismantlingData, setDismantlingData] = useState<any[]>(dismantlingConfigData);
  const [dismantlingPanelTab, setDismantlingPanelTab] = useState<'dismantling' | 'checklist'>('dismantling');

  // États pour la checklist IA de démontage
  const [checklistJsonInput, setChecklistJsonInput] = useState<string>('');
  const [generatedChecklist, setGeneratedChecklist] = useState<any>(null);
  const [expandedChecklistSteps, setExpandedChecklistSteps] = useState<{[key: number]: boolean}>({});
  const [completedChecklistSteps, setCompletedChecklistSteps] = useState<{[key: number]: boolean}>({});

  // États pour le panel de filtres
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState<boolean>(false);
  const [filterCategoryId, setFilterCategoryId] = useState<string>('');
  const [filterSubCategoryId, setFilterSubCategoryId] = useState<string>('');

  // États pour les catégories et sous-catégories
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [availableSubCategories, setAvailableSubCategories] = useState<any[]>([]);

  // Charger les dossiers depuis l'API au montage du composant
  useEffect(() => {
    const loadCaseFiles = async () => {
      try {
        setIsLoadingCaseFiles(true);
        // Demander tous les dossiers avec leur inventaire
        const response = await fetch('https://valotik-api-546691893264.europe-west1.run.app/api/case-files?limit=100&includeInventory=true');
        const result = await response.json();

        if (result.success && result.data.caseFiles) {
          // Transformer les données de l'API au format attendu par l'interface
          const transformedFiles: CaseFile[] = result.data.caseFiles.map((cf: any) => ({
            id: cf.id,
            reference: cf.reference,
            client: cf.request?.client?.raisonSociale || 'Client inconnu',
            site: cf.request?.site?.nom || 'Site inconnu',
            status: cf.statut,
            priority: cf.request?.priorite || 'medium',
            estimatedWeight: cf.poidsEstime || 0,
            realWeight: cf.poidsReel || 0,
            estimatedValue: cf.valeurTotale || 0,
            valeurEstimee: cf.request?.valeurEstimee || 0,
            valeurRevente: cf.request?.valeurRevente || 0,
            createdAt: new Date(cf.createdAt).toLocaleDateString('fr-FR'),
            collectionDate: cf.request?.plannedVisitAt
              ? new Date(cf.request.plannedVisitAt).toLocaleDateString('fr-FR')
              : undefined,
            notifications: 0, // À calculer selon la logique métier
            inventory: cf.lots || [], // Stocker les lots pour le filtrage
          }));

          // Sort by creation date (most recent first) using the raw API date
          transformedFiles.sort((a, b) => {
            const dateA = new Date(result.data.caseFiles.find((cf: any) => cf.id === a.id)?.createdAt || 0);
            const dateB = new Date(result.data.caseFiles.find((cf: any) => cf.id === b.id)?.createdAt || 0);
            return dateB.getTime() - dateA.getTime(); // Descending order (newest first)
          });

          setCaseFiles(transformedFiles);

          // Sélectionner le premier dossier par défaut
          if (transformedFiles.length > 0 && !selectedCaseFile) {
            setSelectedCaseFile(transformedFiles[0].id);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des dossiers:', error);
        // En cas d'erreur, garder des données de démonstration
        setCaseFiles([
          {
            id: 'CF-2025-001',
            reference: 'CF-2025-001',
            client: 'TechCorp Industries',
            site: 'Site Paris 15',
            status: 'in_progress',
            priority: 'high',
            estimatedWeight: 2450,
            realWeight: 2580,
            estimatedValue: 18500,
            valeurEstimee: 12000,
            valeurRevente: 8500,
            createdAt: '2025-10-15',
            collectionDate: '2025-10-20',
            notifications: 2,
          },
        ]);
      } finally {
        setIsLoadingCaseFiles(false);
      }
    };

    loadCaseFiles();
  }, []); // Charger une seule fois au montage

  // Charger les catégories et sous-catégories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const response = await fetch('https://valotik-api-546691893264.europe-west1.run.app/api/categories');
        const result = await response.json();

        if (result.success && result.data) {
          setCategories(result.data);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des catégories:', error);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  // Charger les données de démantèlement depuis le fichier JSON
  useEffect(() => {
    const loadDismantlingData = async () => {
      try {
        const response = await fetch('/dementellement.json');
        const data = await response.json();
        setDismantlingData(data);
      } catch (error) {
        console.error('Erreur lors du chargement des données de démantèlement:', error);
      }
    };

    loadDismantlingData();
  }, []);

  // Mettre à jour les sous-catégories disponibles quand la catégorie change
  useEffect(() => {
    if (selectedCategoryId && categories.length > 0) {
      const category = categories.find(cat => cat.id === selectedCategoryId);
      if (category && category.subCategories) {
        setAvailableSubCategories(category.subCategories);
      } else {
        setAvailableSubCategories([]);
      }
    } else {
      setAvailableSubCategories([]);
    }
  }, [selectedCategoryId, categories]);

  // États pour les sous-catégories disponibles pour le filtre
  const [filterAvailableSubCategories, setFilterAvailableSubCategories] = useState<any[]>([]);

  // Mettre à jour les sous-catégories disponibles pour le filtre quand la catégorie de filtre change
  useEffect(() => {
    if (filterCategoryId && categories.length > 0) {
      const category = categories.find(cat => cat.id === filterCategoryId);
      if (category && category.subCategories) {
        setFilterAvailableSubCategories(category.subCategories);
      } else {
        setFilterAvailableSubCategories([]);
      }
    } else {
      setFilterAvailableSubCategories([]);
      setFilterSubCategoryId(''); // Réinitialiser la sous-catégorie si pas de catégorie
    }
  }, [filterCategoryId, categories]);

  // Initialiser la catégorie sélectionnée quand un composant est ouvert
  useEffect(() => {
    if (selectedComponent && selectedComponent.subCategory) {
      setSelectedCategoryId(selectedComponent.subCategory.categoryId);
    } else {
      setSelectedCategoryId('');
    }
  }, [selectedComponent]);

  // Charger les détails du dossier sélectionné
  useEffect(() => {
    if (selectedCaseFile) {
      loadCaseFileDetails(selectedCaseFile);
    }
  }, [selectedCaseFile, caseFiles]);

  // Charger les utilisateurs assignés au dossier sélectionné
  useEffect(() => {
    const loadAssignedUsers = async () => {
      if (!selectedCaseFile) {
        setUsers([]);
        return;
      }

      try {
        setIsLoadingUsers(true);
        const response = await fetch(`https://valotik-api-546691893264.europe-west1.run.app/api/case-files/${selectedCaseFile}/users`);
        const result = await response.json();

        if (result.success && result.data) {
          setUsers(result.data);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs assignés:', error);
        setUsers([]);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    loadAssignedUsers();
  }, [selectedCaseFile]);

  // Templates de composants physiques par type d'équipement
  const getPhysicalComponentsForEquipment = (equipmentName: string, categoryName: string) => {
    const name = equipmentName.toLowerCase();
    const category = categoryName.toLowerCase();

    // PC de bureau / Unités centrales
    if (name.includes('optiplex') || name.includes('elitedesk') || name.includes('thinkcentre') ||
        name.includes('pc ') || (category.includes('unités centrales') || category.includes('unite'))) {
      return [
        { type: 'alimentation-atx', weight: 1.2, material: 'metaux-cuivre-transformateur' },
        { type: 'carte-mere', weight: 0.4, material: 'pcb-metaux-precieux' },
        { type: 'processeur-cpu', weight: 0.05, material: 'silicium-metaux-precieux' },
        { type: 'memoire-ram', weight: 0.15, material: 'pcb-metaux' },
        { type: 'disque-dur-hdd', weight: 0.6, material: 'metaux-plastique-aimants' },
        { type: 'carte-graphique', weight: 0.3, material: 'pcb-metaux-cuivre' },
        { type: 'ventilateurs', weight: 0.2, material: 'plastique-cuivre' },
        { type: 'cables-connecteurs', weight: 0.3, material: 'cuivre-plastique' },
        { type: 'boitier-metal', weight: 3.5, material: 'acier-aluminium' },
        { type: 'lecteur-optique-dvd', weight: 0.4, material: 'plastique-metaux' },
        { type: 'pile-cmos', weight: 0.01, material: 'lithium-bouton' }
      ];
    }

    // PC portables
    if (name.includes('thinkpad') || name.includes('latitude') || name.includes('elitebook') ||
        name.includes('laptop') || name.includes('portable')) {
      return [
        { type: 'ecran-lcd', weight: 0.5, material: 'verre-plastique-led' },
        { type: 'batterie-lithium-ion', weight: 0.3, material: 'lithium-ion-cobalt' },
        { type: 'carte-mere-laptop', weight: 0.25, material: 'pcb-metaux-precieux' },
        { type: 'processeur-cpu', weight: 0.03, material: 'silicium-metaux-precieux' },
        { type: 'memoire-ram-sodimm', weight: 0.08, material: 'pcb-metaux' },
        { type: 'ssd-m2', weight: 0.08, material: 'pcb-metaux-nand' },
        { type: 'clavier', weight: 0.15, material: 'plastique-silicone-cuivre' },
        { type: 'touchpad', weight: 0.05, material: 'plastique-capteurs' },
        { type: 'cables-nappes', weight: 0.1, material: 'cuivre-plastique-souple' },
        { type: 'charnières-metal', weight: 0.12, material: 'acier-inox' },
        { type: 'coque-plastique-alu', weight: 0.8, material: 'aluminium-plastique' },
        { type: 'webcam', weight: 0.02, material: 'plastique-capteur-optique' },
        { type: 'ventilateur-refroidissement', weight: 0.08, material: 'plastique-cuivre' }
      ];
    }

    // Écrans / Moniteurs
    if (name.includes('écran') || name.includes('ecran') || name.includes('monitor') ||
        name.includes('ultrasharp') || name.includes('display') || category.includes('ecran')) {
      return [
        { type: 'dalle-lcd-led', weight: 1.2, material: 'verre-cristaux-liquides-led' },
        { type: 'carte-alimentation', weight: 0.3, material: 'pcb-transformateur-condensateurs' },
        { type: 'carte-traitement-image', weight: 0.15, material: 'pcb-metaux-precieux' },
        { type: 'cadre-plastique', weight: 0.6, material: 'abs-polycarbonate' },
        { type: 'support-pied', weight: 1.5, material: 'acier-plastique' },
        { type: 'cables-video-alimentation', weight: 0.2, material: 'cuivre-plastique' },
        { type: 'boutons-commandes', weight: 0.05, material: 'plastique-contacts-electroniques' },
        { type: 'nappe-retroeclairage', weight: 0.08, material: 'led-cuivre-plastique' }
      ];
    }

    // Serveurs
    if (name.includes('serveur') || name.includes('server') || name.includes('poweredge') ||
        name.includes('proliant') || category.includes('serveur')) {
      return [
        { type: 'chassis-rack-metal', weight: 12, material: 'acier-aluminium-rail' },
        { type: 'carte-mere-serveur', weight: 1.8, material: 'pcb-metaux-precieux-haute-densite' },
        { type: 'processeurs-cpu-multiples', weight: 0.3, material: 'silicium-or-cuivre' },
        { type: 'memoire-ram-ecc', weight: 0.8, material: 'pcb-metaux-ddr4' },
        { type: 'disques-durs-sas', weight: 2.4, material: 'metaux-plastique-aimants-neodyme' },
        { type: 'controleur-raid', weight: 0.4, material: 'pcb-cache-batterie' },
        { type: 'alimentations-redondantes', weight: 3.5, material: 'metaux-cuivre-transformateur-haute-puissance' },
        { type: 'ventilateurs-hot-swap', weight: 0.8, material: 'plastique-cuivre-roulement' },
        { type: 'carte-reseau-double', weight: 0.2, material: 'pcb-connecteurs-rj45' },
        { type: 'backplane-connecteurs', weight: 0.6, material: 'pcb-connecteurs-sata-sas' },
        { type: 'rails-montage', weight: 2, material: 'acier-inox' }
      ];
    }

    // Câbles et accessoires
    if (name.includes('cable') || name.includes('câble') || name.includes('souris') ||
        name.includes('clavier') || name.includes('accessoire')) {
      return [
        { type: 'fils-cuivre', weight: 0.3, material: 'cuivre-gaine-pvc' },
        { type: 'connecteurs-plastique-metal', weight: 0.1, material: 'plastique-contacts-cuivre' },
        { type: 'circuits-electroniques-mini', weight: 0.05, material: 'pcb-led-capteurs' }
      ];
    }

    // Fallback générique
    return [
      { type: 'composant-electronique', weight: 0.5, material: 'pcb-metaux' },
      { type: 'plastique-divers', weight: 0.3, material: 'abs-polycarbonate' },
      { type: 'metaux-divers', weight: 0.4, material: 'acier-aluminium-cuivre' }
    ];
  };

  // Pré-remplir automatiquement le JSON de la checklist avec les données du lot
  useEffect(() => {
    if (selectedLotForDismantling && isDismantlingPanelOpen) {
      const lot = selectedLotForDismantling;
      const equipments = lot.components || []; // Ce sont des équipements complets (PC, écrans, etc.)

      let allPhysicalComponents: any[] = [];

      if (equipments.length > 0) {
        // Décomposer chaque équipement en ses composants physiques réels
        console.log('🔧 Décomposition des équipements en composants physiques:');

        equipments.forEach((equipment: any) => {
          const equipmentName = equipment.nom || equipment.name || '';
          const categoryName = lot.categorieName || '';

          console.log(`  - ${equipmentName} (catégorie: ${categoryName})`);

          // Obtenir les composants physiques pour cet équipement
          const physicalComponents = getPhysicalComponentsForEquipment(equipmentName, categoryName);

          // Ajouter les composants à la liste globale
          allPhysicalComponents = allPhysicalComponents.concat(physicalComponents);
        });

        console.log(`✅ Total composants générés: ${allPhysicalComponents.length}`);
      } else {
        // Si pas d'équipements dans le lot, générer des composants basés sur la catégorie
        console.log('⚠️  Aucun équipement trouvé, génération basée sur la catégorie du lot');
        allPhysicalComponents = getPhysicalComponentsForEquipment('', lot.categorieName || '');
      }

      const jsonData = {
        category: lot.categorieName || 'equipements-divers',
        subcategory: lot.subcategory || 'general',
        components: allPhysicalComponents
      };

      // Pré-remplir le textarea avec le JSON formaté
      setChecklistJsonInput(JSON.stringify(jsonData, null, 2));

      // Auto-générer la checklist immédiatement
      console.log('🤖 Auto-génération de la checklist IA...');
      const result = generateDismantlingChecklist(jsonData);
      setGeneratedChecklist(result);
      setCompletedChecklistSteps({});
      console.log('✅ Checklist générée automatiquement!');
    }
  }, [selectedLotForDismantling, isDismantlingPanelOpen]);

  // Pré-remplir le formulaire en mode édition
  useEffect(() => {
    if (isEditMode && isRequestPanelOpen && selectedCaseFileDetails) {
      const request = selectedCaseFileDetails.request || {};
      const client = request.client || {};
      const site = request.site || {};
      const contact = request.contact || {};

      setFormData({
        clientName: client.raisonSociale || '',
        siteName: site.nom || '',
        siteAddress: site.adresseComplete || '',
        contactName: contact.nom || '',
        contactFunction: contact.fonction || '',
        contactPhone: contact.telephone || '',
        contactEmail: contact.email || '',
        description: request.descriptionInitiale || request.description || '',
        mainCategory: request.categoriePrincipale || 'informatique',
        estimatedVolume: request.volumeEstime?.toString() || '',
        valeurEstimee: request.valeurEstimee?.toString() || '',
        valeurRevente: request.valeurRevente?.toString() || '',
        priority: request.priorite || 'medium',
        plannedVisitDate: request.plannedVisitAt
          ? new Date(request.plannedVisitAt).toISOString().split('T')[0]
          : '',
        accessNotes: request.accessNotes || '',
      });
    } else if (!isEditMode && isRequestPanelOpen) {
      // Réinitialiser le formulaire en mode création
      setFormData({
        clientName: '',
        siteName: '',
        siteAddress: '',
        contactName: '',
        contactFunction: '',
        contactPhone: '',
        contactEmail: '',
        description: '',
        mainCategory: 'informatique',
        estimatedVolume: '',
        valeurEstimee: '',
        valeurRevente: '',
        priority: 'medium',
        plannedVisitDate: '',
        accessNotes: '',
      });
    }
  }, [isEditMode, isRequestPanelOpen, selectedCaseFileDetails]);

  // Données de démonstration pour les autres sections (à remplacer plus tard par l'API)

  const lots: Lot[] = [
    {
      id: 'LOT-001',
      code: 'LOT-001',
      category: 'Informatique - Unités centrales',
      grade: 'A',
      orientation: 'resale',
      estimatedWeight: 450,
      realWeight: 478,
      status: 'Réceptionné',
      qrCode: 'QR-LOT-001',
    },
    {
      id: 'LOT-002',
      code: 'LOT-002',
      category: 'Informatique - Écrans',
      grade: 'B',
      orientation: 'refurbishment',
      estimatedWeight: 680,
      realWeight: 695,
      status: 'En démantèlement',
      qrCode: 'QR-LOT-002',
    },
    {
      id: 'LOT-003',
      code: 'LOT-003',
      category: 'Câbles et accessoires',
      grade: 'C',
      orientation: 'dismantling',
      estimatedWeight: 320,
      realWeight: 310,
      status: 'Réceptionné',
      qrCode: 'QR-LOT-003',
    },
    {
      id: 'LOT-004',
      code: 'LOT-004',
      category: 'Serveurs et équipements réseau',
      grade: 'A',
      orientation: 'resale',
      estimatedWeight: 1000,
      realWeight: 1097,
      status: 'En stock',
      qrCode: 'QR-LOT-004',
    },
  ];

  const quotationLines: QuotationLine[] = [
    {
      id: '1',
      type: 'service',
      description: 'Transport - Forfait enlèvement',
      unit: 'forfait',
      quantity: 1,
      unitPrice: 450,
      vatRate: 20,
      total: 540,
    },
    {
      id: '2',
      type: 'service',
      description: 'Manutention - 2 manutentionnaires',
      unit: 'heure',
      quantity: 4,
      unitPrice: 45,
      vatRate: 20,
      total: 216,
    },
    {
      id: '3',
      type: 'material',
      description: 'Palettes EUR - Location',
      unit: 'pièce',
      quantity: 3,
      unitPrice: 15,
      vatRate: 20,
      total: 54,
    },
    {
      id: '4',
      type: 'service',
      description: 'Diagnostic et inventaire sur site',
      unit: 'forfait',
      quantity: 1,
      unitPrice: 350,
      vatRate: 20,
      total: 420,
    },
  ];

  const transportOrders: TransportOrder[] = [
    {
      id: 'TO-001',
      type: 'Enlèvement',
      transporter: 'Transport Express',
      vehicle: 'Camion 12T - AA-123-BB',
      driver: 'Jean Dupont',
      status: 'completed',
      plannedDate: '2025-10-20',
      documents: ['bon_pesée.pdf', 'bon_transport.pdf'],
    },
    {
      id: 'TO-002',
      type: 'Livraison entrepôt',
      transporter: 'Logistique Pro',
      vehicle: 'Camion 20T - CC-456-DD',
      driver: 'Marie Martin',
      status: 'in_progress',
      plannedDate: '2025-10-21',
      documents: ['ordre_transport.pdf'],
    },
  ];

  // Fonctions utilitaires
  const getStatusColor = (status: string): string => {
    const colors: { [key: string]: string } = {
      diagnostic_pending: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30',
      quote_pending: 'bg-blue-500/20 text-blue-700 border-blue-500/30',
      quote_approved: 'bg-green-500/20 text-green-700 border-green-500/30',
      in_collection: 'bg-purple-500/20 text-purple-700 border-purple-500/30',
      in_progress: 'bg-cyan-500/20 text-cyan-700 border-cyan-500/30',
      completed: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
      planned: 'bg-blue-500/20 text-blue-700 border-blue-500/30',
      delayed: 'bg-red-500/20 text-red-700 border-red-500/30',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  const getStatusLabel = (status: string): string => {
    const labels: { [key: string]: string } = {
      diagnostic_pending: 'Diagnostic à planifier',
      quote_pending: 'Devis en attente',
      quote_approved: 'Devis approuvé',
      in_collection: 'En collecte',
      in_progress: 'En cours',
      completed: 'Terminé',
      planned: 'Planifié',
      delayed: 'Retardé',
    };
    return labels[status] || status;
  };

  const getGradeColor = (grade: string): string => {
    const colors: { [key: string]: string } = {
      A: 'bg-emerald-500/20 text-emerald-700 border-emerald-500/40',
      B: 'bg-blue-500/20 text-blue-700 border-blue-500/40',
      C: 'bg-orange-500/20 text-orange-700 border-orange-500/40',
      D: 'bg-red-500/20 text-red-700 border-red-500/40',
    };
    return colors[grade] || 'bg-gray-500/20 text-gray-300 border-gray-500/40';
  };

  const getPriorityColor = (priority: string): string => {
    const colors: { [key: string]: string } = {
      high: 'text-red-600',
      medium: 'text-yellow-600',
      low: 'text-green-600',
    };
    return colors[priority] || 'text-gray-400';
  };

  // Gestion du formulaire
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Appeler l'API via le service centralisé
      const result = await pickupRequestsApi.create(formData);

      if (result.success) {
        alert('Demande créée avec succès! Référence: ' + result.data.caseFile.reference);
        setIsRequestPanelOpen(false);
        // Réinitialiser le formulaire
        setFormData({
          clientName: '',
          siteName: '',
          siteAddress: '',
          contactName: '',
          contactFunction: '',
          contactPhone: '',
          contactEmail: '',
          description: '',
          mainCategory: 'informatique',
          estimatedVolume: '',
          valeurEstimee: '',
          valeurRevente: '',
          priority: 'medium',
          plannedVisitDate: '',
          accessNotes: '',
        });
        // Recharger la page pour voir la nouvelle demande
        window.location.reload();
      } else {
        alert('Erreur: ' + result.error);
      }
    } catch (error: any) {
      console.error('Erreur lors de la création de la demande:', error);
      alert('Erreur de connexion au serveur. Assurez-vous que le backend est démarré sur le port 5000.');
    }
  };

  // Composants d'onglets
  const DashboardTab = () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth(); // 0-11
    const [viewMode, setViewMode] = useState<'week' | 'month' | 'year'>('month');
    const [selectedPeriod, setSelectedPeriod] = useState<string>('current');

    // Calculer les KPI à partir des dossiers chargés
    const totalDemandes = caseFiles.length;
    const demandesEnCours = caseFiles.filter(cf => cf.status === 'in_progress' || cf.status === 'diagnosis').length;
    const demandesTerminees = caseFiles.filter(cf => cf.status === 'closed' || cf.status === 'completed').length;
    const poidsTotal = caseFiles.reduce((sum, cf) => sum + (cf.realWeight > 0 ? cf.realWeight : cf.estimatedWeight), 0);
    const valeurTotale = caseFiles.reduce((sum, cf) => sum + (cf.valeurEstimee || 0), 0);
    const valeurRevente = caseFiles.reduce((sum, cf) => sum + (cf.valeurRevente || 0), 0);

    // Données par période
    const dataByPeriod = {
      week: {
        current: [
          { period: 'S1', demandes: 5, poids: 580, valeur: 8700, recycle: 65, reemploi: 35 },
          { period: 'S2', demandes: 7, poids: 720, valeur: 10800, recycle: 58, reemploi: 42 },
          { period: 'S3', demandes: 6, poids: 650, valeur: 9750, recycle: 62, reemploi: 38 },
          { period: 'S4', demandes: 4, poids: 500, valeur: 7500, recycle: 70, reemploi: 30 },
        ],
        previous: [
          { period: 'S1', demandes: 4, poids: 520, valeur: 7800, recycle: 68, reemploi: 32 },
          { period: 'S2', demandes: 6, poids: 680, valeur: 10200, recycle: 60, reemploi: 40 },
          { period: 'S3', demandes: 5, poids: 590, valeur: 8850, recycle: 65, reemploi: 35 },
          { period: 'S4', demandes: 5, poids: 550, valeur: 8250, recycle: 63, reemploi: 37 },
        ]
      },
      month: {
        current: [
          { period: 'Jan', demandes: 12, poids: 1250, valeur: 18500, recycle: 65, reemploi: 35 },
          { period: 'Fév', demandes: 15, poids: 1680, valeur: 24200, recycle: 58, reemploi: 42 },
          { period: 'Mar', demandes: 18, poids: 2100, valeur: 31800, recycle: 55, reemploi: 45 },
          { period: 'Avr', demandes: 14, poids: 1420, valeur: 21000, recycle: 62, reemploi: 38 },
          { period: 'Mai', demandes: 20, poids: 2450, valeur: 36500, recycle: 52, reemploi: 48 },
          { period: 'Juin', demandes: 16, poids: 1890, valeur: 27400, recycle: 60, reemploi: 40 },
          { period: 'Juil', demandes: 13, poids: 1320, valeur: 19800, recycle: 68, reemploi: 32 },
          { period: 'Août', demandes: 10, poids: 980, valeur: 14500, recycle: 72, reemploi: 28 },
          { period: 'Sep', demandes: 19, poids: 2280, valeur: 34200, recycle: 54, reemploi: 46 },
          { period: 'Oct', demandes: 22, poids: 2650, valeur: 39800, recycle: 50, reemploi: 50 },
        ],
        previous: [
          { period: 'Jan', demandes: 10, poids: 1100, valeur: 16500, recycle: 70, reemploi: 30 },
          { period: 'Fév', demandes: 13, poids: 1450, valeur: 21750, recycle: 65, reemploi: 35 },
          { period: 'Mar', demandes: 16, poids: 1900, valeur: 28500, recycle: 60, reemploi: 40 },
          { period: 'Avr', demandes: 12, poids: 1250, valeur: 18750, recycle: 68, reemploi: 32 },
          { period: 'Mai', demandes: 18, poids: 2150, valeur: 32250, recycle: 58, reemploi: 42 },
          { period: 'Juin', demandes: 14, poids: 1650, valeur: 24750, recycle: 64, reemploi: 36 },
          { period: 'Juil', demandes: 11, poids: 1150, valeur: 17250, recycle: 72, reemploi: 28 },
          { period: 'Août', demandes: 9, poids: 880, valeur: 13200, recycle: 75, reemploi: 25 },
          { period: 'Sep', demandes: 17, poids: 2050, valeur: 30750, recycle: 59, reemploi: 41 },
          { period: 'Oct', demandes: 20, poids: 2400, valeur: 36000, recycle: 55, reemploi: 45 },
          { period: 'Nov', demandes: 15, poids: 1750, valeur: 26250, recycle: 62, reemploi: 38 },
          { period: 'Déc', demandes: 13, poids: 1380, valeur: 20700, recycle: 67, reemploi: 33 },
        ]
      },
      year: {
        current: [
          { period: '2021', demandes: 145, poids: 16500, valeur: 247500, recycle: 75, reemploi: 25 },
          { period: '2022', demandes: 168, poids: 18900, valeur: 283500, recycle: 70, reemploi: 30 },
          { period: '2023', demandes: 182, poids: 20800, valeur: 312000, recycle: 65, reemploi: 35 },
          { period: '2024', demandes: 195, poids: 22400, valeur: 336000, recycle: 60, reemploi: 40 },
          { period: '2025', demandes: 190, poids: 21500, valeur: 322500, recycle: 58, reemploi: 42 },
        ]
      }
    };

    // Sélectionner les données en fonction du mode de vue et de la période
    const getChartData = () => {
      if (viewMode === 'year') return dataByPeriod.year.current;
      return dataByPeriod[viewMode][selectedPeriod as 'current' | 'previous'];
    };

    const chartData = getChartData();
    const maxDemandes = Math.max(...chartData.map(m => m.demandes));
    const maxPoids = Math.max(...chartData.map(m => m.poids));

    // Calculer les statistiques d'orientation
    const totalRecycle = chartData.reduce((sum, d) => sum + d.recycle, 0) / chartData.length;
    const totalReemploi = chartData.reduce((sum, d) => sum + d.reemploi, 0) / chartData.length;

    // Obtenir le label de période
    const getPeriodLabel = () => {
      if (viewMode === 'week') return selectedPeriod === 'current' ? 'Mois en cours' : 'Mois dernier';
      if (viewMode === 'month') return selectedPeriod === 'current' ? `Année ${currentYear}` : `Année ${currentYear - 1}`;
      return 'Historique 5 ans';
    };

    return (
      <div className="space-y-6">
        {/* En-tête Dashboard avec sélecteur de période stylé */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          <div>
            <h2 className={`text-xl font-bold ${headingClasses} flex items-center gap-2`}>
              <BarChart3 className="w-6 h-6 text-cyan-600" />
              Dashboard - {getPeriodLabel()}
            </h2>
            <p className={`mt-0.5 text-xs ${subTextClasses}`}>Vue d'ensemble de l'activité et des performances</p>
          </div>

          {/* Sélecteur de vue stylé avec effet néon */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Sélecteur de mode (Semaine/Mois/Année) */}
            <div className={`inline-flex items-center ${bg('bg-slate-800/50', 'bg-gray-100')} p-1 rounded-xl border ${border('border-slate-700', 'border-gray-200')} backdrop-blur-sm`}>
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                  viewMode === 'week'
                    ? `${bg('bg-gradient-to-r from-purple-600 to-purple-500', 'bg-purple-600')} text-white shadow-lg shadow-purple-500/50`
                    : `${text('text-slate-400', 'text-gray-600')} hover:${text('text-slate-300', 'text-gray-900')}`
                }`}
              >
                <Calendar className="w-4 h-4" />
                Semaine
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                  viewMode === 'month'
                    ? `${bg('bg-gradient-to-r from-cyan-600 to-cyan-500', 'bg-cyan-600')} text-white shadow-lg shadow-cyan-500/50`
                    : `${text('text-slate-400', 'text-gray-600')} hover:${text('text-slate-300', 'text-gray-900')}`
                }`}
              >
                <Calendar className="w-4 h-4" />
                Mois
              </button>
              <button
                onClick={() => setViewMode('year')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                  viewMode === 'year'
                    ? `${bg('bg-gradient-to-r from-emerald-600 to-emerald-500', 'bg-emerald-600')} text-white shadow-lg shadow-emerald-500/50`
                    : `${text('text-slate-400', 'text-gray-600')} hover:${text('text-slate-300', 'text-gray-900')}`
                }`}
              >
                <Calendar className="w-4 h-4" />
                Année
              </button>
            </div>

            {/* Sélecteur de période (En cours/Précédent) - Affiché uniquement pour semaine et mois */}
            {viewMode !== 'year' && (
              <div className={`inline-flex items-center ${bg('bg-slate-800/50', 'bg-gray-100')} p-1 rounded-xl border ${border('border-slate-700', 'border-gray-200')} backdrop-blur-sm`}>
                <button
                  onClick={() => setSelectedPeriod('current')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                    selectedPeriod === 'current'
                      ? `${bg('bg-gradient-to-r from-blue-600 to-blue-500', 'bg-blue-600')} text-white shadow-lg shadow-blue-500/50`
                      : `${text('text-slate-400', 'text-gray-600')} hover:${text('text-slate-300', 'text-gray-900')}`
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  En cours
                </button>
                <button
                  onClick={() => setSelectedPeriod('previous')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                    selectedPeriod === 'previous'
                      ? `${bg('bg-gradient-to-r from-orange-600 to-orange-500', 'bg-orange-600')} text-white shadow-lg shadow-orange-500/50`
                      : `${text('text-slate-400', 'text-gray-600')} hover:${text('text-slate-300', 'text-gray-900')}`
                  }`}
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  Précédent
                </button>
              </div>
            )}
          </div>
        </div>

        {/* KPI Cards avec effet néon - Version compacte */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Total Demandes */}
          <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-lg p-3 relative overflow-hidden group hover:shadow-md hover:shadow-purple-500/20 transition-all`}>
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-xl group-hover:scale-125 transition-transform"></div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`p-1.5 rounded ${bg('bg-purple-500/20', 'bg-purple-100')}`}>
                  <FileText className="w-3.5 h-3.5 text-purple-600" />
                </div>
                <div className={`text-[10px] ${subTextClasses} uppercase tracking-wide font-medium`}>Total</div>
              </div>
              <div className={`text-2xl font-bold ${text('text-purple-600', 'text-purple-600')} mb-0.5`}>{totalDemandes}</div>
              <div className={`text-[10px] ${subTextClasses}`}>Demandes</div>
              <div className="mt-1.5 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-600 text-[10px] font-medium">+12%</span>
              </div>
            </div>
          </div>

          {/* Demandes en cours */}
          <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-lg p-3 relative overflow-hidden group hover:shadow-md hover:shadow-blue-500/20 transition-all`}>
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-xl group-hover:scale-125 transition-transform"></div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`p-1.5 rounded ${bg('bg-blue-500/20', 'bg-blue-100')}`}>
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className={`text-[10px] ${subTextClasses} uppercase tracking-wide font-medium`}>En cours</div>
              </div>
              <div className={`text-2xl font-bold ${text('text-blue-600', 'text-blue-600')} mb-0.5`}>{demandesEnCours}</div>
              <div className={`text-[10px] ${subTextClasses}`}>Actives</div>
              <div className="mt-1.5 flex items-center gap-1">
                <Clock className="w-3 h-3 text-blue-600" />
                <span className="text-blue-600 text-[10px] font-medium">En cours</span>
              </div>
            </div>
          </div>

          {/* Poids Total */}
          <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-lg p-3 relative overflow-hidden group hover:shadow-md hover:shadow-cyan-500/20 transition-all`}>
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-xl group-hover:scale-125 transition-transform"></div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`p-1.5 rounded ${bg('bg-cyan-500/20', 'bg-cyan-100')}`}>
                  <Weight className="w-3.5 h-3.5 text-cyan-600" />
                </div>
                <div className={`text-[10px] ${subTextClasses} uppercase tracking-wide font-medium`}>Poids</div>
              </div>
              <div className={`text-2xl font-bold ${text('text-cyan-600', 'text-cyan-600')} mb-0.5`}>{(poidsTotal / 1000).toFixed(1)}</div>
              <div className={`text-[10px] ${subTextClasses}`}>Tonnes</div>
              <div className="mt-1.5 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-600 text-[10px] font-medium">+8%</span>
              </div>
            </div>
          </div>

          {/* Valeur Totale */}
          <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-lg p-3 relative overflow-hidden group hover:shadow-md hover:shadow-emerald-500/20 transition-all`}>
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-xl group-hover:scale-125 transition-transform"></div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`p-1.5 rounded ${bg('bg-emerald-500/20', 'bg-emerald-100')}`}>
                  <Euro className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className={`text-[10px] ${subTextClasses} uppercase tracking-wide font-medium`}>Valeur</div>
              </div>
              <div className={`text-2xl font-bold ${text('text-emerald-600', 'text-emerald-600')} mb-0.5`}>{valeurTotale.toLocaleString()} €</div>
              <div className={`text-[10px] ${subTextClasses}`}>Estimée</div>
              <div className={`text-xs ${subTextClasses} mt-1`}>
                Revente: {valeurRevente.toLocaleString()} €
              </div>
            </div>
          </div>
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Graphique Demandes */}
          <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-xl p-4`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-sm font-semibold ${headingClasses} flex items-center gap-2`}>
                <BarChart3 className="w-4 h-4 text-purple-600" />
                Demandes {viewMode === 'week' ? 'par semaine' : viewMode === 'month' ? 'par mois' : 'par année'}
              </h3>
              <div className={`px-2 py-0.5 rounded-lg ${bg('bg-purple-500/10', 'bg-purple-50')} text-purple-600 text-[10px] font-medium`}>
                {chartData.reduce((sum, m) => sum + m.demandes, 0)} total
              </div>
            </div>

            {/* Graphique en barres avec effet néon */}
            <div className="space-y-2">
              {chartData.map((data, index) => (
                <div key={data.period} className="flex items-center gap-2">
                  <div className={`w-10 text-[10px] ${subTextClasses} font-medium`}>{data.period}</div>
                  <div className="flex-1 relative h-6 rounded-lg overflow-hidden" style={{ background: isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(226, 232, 240, 1)' }}>
                    <div
                      className="absolute inset-y-0 left-0 rounded-lg transition-all duration-700 ease-out"
                      style={{
                        width: `${(data.demandes / maxDemandes) * 100}%`,
                        background: isDark
                          ? 'linear-gradient(90deg, rgba(168, 85, 247, 0.8) 0%, rgba(139, 92, 246, 0.6) 100%)'
                          : 'linear-gradient(90deg, rgba(168, 85, 247, 0.9) 0%, rgba(139, 92, 246, 0.7) 100%)',
                        boxShadow: isDark ? '0 0 15px rgba(168, 85, 247, 0.4)' : '0 0 8px rgba(168, 85, 247, 0.3)',
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                    </div>
                    <div className={`absolute inset-0 flex items-center px-2 text-xs font-bold ${text('text-white', 'text-purple-900')}`}>
                      {data.demandes}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Graphique Poids collecté */}
          <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-xl p-4`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-sm font-semibold ${headingClasses} flex items-center gap-2`}>
                <Weight className="w-4 h-4 text-cyan-600" />
                Poids collecté (kg)
              </h3>
              <div className={`px-2 py-0.5 rounded-lg ${bg('bg-cyan-500/10', 'bg-cyan-50')} text-cyan-600 text-[10px] font-medium`}>
                {chartData.reduce((sum, m) => sum + m.poids, 0).toLocaleString()} kg
              </div>
            </div>

            {/* Graphique en barres avec effet néon cyan */}
            <div className="space-y-2">
              {chartData.map((data, index) => (
                <div key={data.period} className="flex items-center gap-2">
                  <div className={`w-10 text-[10px] ${subTextClasses} font-medium`}>{data.period}</div>
                  <div className="flex-1 relative h-6 rounded-lg overflow-hidden" style={{ background: isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(226, 232, 240, 1)' }}>
                    <div
                      className="absolute inset-y-0 left-0 rounded-lg transition-all duration-700 ease-out"
                      style={{
                        width: `${(data.poids / maxPoids) * 100}%`,
                        background: isDark
                          ? 'linear-gradient(90deg, rgba(34, 211, 238, 0.8) 0%, rgba(6, 182, 212, 0.6) 100%)'
                          : 'linear-gradient(90deg, rgba(34, 211, 238, 0.9) 0%, rgba(6, 182, 212, 0.7) 100%)',
                        boxShadow: isDark ? '0 0 15px rgba(34, 211, 238, 0.4)' : '0 0 8px rgba(34, 211, 238, 0.3)',
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                    </div>
                    <div className={`absolute inset-0 flex items-center px-2 text-xs font-bold ${text('text-white', 'text-cyan-900')}`}>
                      {data.poids.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Nouveaux graphiques pertinents */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Graphique Orientation (Recyclage vs Réemploi) */}
          <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-xl p-4`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-sm font-semibold ${headingClasses} flex items-center gap-2`}>
                <Repeat className="w-4 h-4 text-emerald-600" />
                Orientation
              </h3>
            </div>
            <div className="space-y-3">
              {/* Recyclage */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] ${subTextClasses} flex items-center gap-1`}>
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    Recyclage
                  </span>
                  <span className={`text-xs font-bold text-emerald-600`}>{totalRecycle.toFixed(0)}%</span>
                </div>
                <div className="relative h-4 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(226, 232, 240, 1)' }}>
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                    style={{
                      width: `${totalRecycle}%`,
                      background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.7) 100%)',
                      boxShadow: isDark ? '0 0 12px rgba(16, 185, 129, 0.5)' : '0 0 6px rgba(16, 185, 129, 0.3)',
                    }}
                  />
                </div>
              </div>
              {/* Réemploi */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] ${subTextClasses} flex items-center gap-1`}>
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    Réemploi
                  </span>
                  <span className={`text-xs font-bold text-amber-400`}>{totalReemploi.toFixed(0)}%</span>
                </div>
                <div className="relative h-4 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(226, 232, 240, 1)' }}>
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                    style={{
                      width: `${totalReemploi}%`,
                      background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.9) 0%, rgba(217, 119, 6, 0.7) 100%)',
                      boxShadow: isDark ? '0 0 12px rgba(245, 158, 11, 0.5)' : '0 0 6px rgba(245, 158, 11, 0.3)',
                    }}
                  />
                </div>
              </div>
              {/* Total traité */}
              <div className={`pt-2 border-t ${border('border-slate-700/50', 'border-gray-200')}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] ${subTextClasses}`}>Total traité</span>
                  <span className={`text-xs font-bold ${headingClasses}`}>100%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Graphique Top Catégories */}
          <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-xl p-4`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-sm font-semibold ${headingClasses} flex items-center gap-2`}>
                <Layers className="w-4 h-4 text-blue-600" />
                Top Catégories
              </h3>
            </div>
            <div className="space-y-2">
              {[
                { name: 'Électroménager', percent: 35, color: 'rgba(59, 130, 246, 0.8)' },
                { name: 'Informatique', percent: 28, color: 'rgba(99, 102, 241, 0.8)' },
                { name: 'Téléphonie', percent: 20, color: 'rgba(139, 92, 246, 0.8)' },
                { name: 'Audiovisuel', percent: 17, color: 'rgba(168, 85, 247, 0.8)' },
              ].map((cat) => (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-[10px] ${subTextClasses}`}>{cat.name}</span>
                    <span className={`text-[10px] font-medium ${headingClasses}`}>{cat.percent}%</span>
                  </div>
                  <div className="relative h-3 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(226, 232, 240, 1)' }}>
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                      style={{
                        width: `${cat.percent}%`,
                        background: cat.color,
                        boxShadow: isDark ? `0 0 10px ${cat.color}` : `0 0 5px ${cat.color}`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Graphique Tendances */}
          <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-xl p-4`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-sm font-semibold ${headingClasses} flex items-center gap-2`}>
                <TrendingUp className="w-4 h-4 text-rose-600" />
                Évolution
              </h3>
            </div>
            <div className="space-y-3">
              <div className={`p-2 rounded-lg ${bg('bg-emerald-500/10', 'bg-emerald-50')}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] ${subTextClasses}`}>Demandes</span>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-600 text-xs font-bold">+12%</span>
                  </div>
                </div>
                <div className={`text-xs ${text('text-emerald-700', 'text-emerald-700')}`}>vs période précédente</div>
              </div>
              <div className={`p-2 rounded-lg ${bg('bg-cyan-500/10', 'bg-cyan-50')}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] ${subTextClasses}`}>Poids</span>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-cyan-600" />
                    <span className="text-cyan-600 text-xs font-bold">+8%</span>
                  </div>
                </div>
                <div className={`text-xs ${text('text-cyan-700', 'text-cyan-700')}`}>vs période précédente</div>
              </div>
              <div className={`p-2 rounded-lg ${bg('bg-purple-500/10', 'bg-purple-50')}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] ${subTextClasses}`}>Valeur</span>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-purple-600" />
                    <span className="text-purple-600 text-xs font-bold">+15%</span>
                  </div>
                </div>
                <div className={`text-xs ${text('text-purple-700', 'text-purple-700')}`}>vs période précédente</div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques supplémentaires */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Taux de complétion */}
          <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-xl p-4`}>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h3 className={`text-sm font-semibold ${headingClasses}`}>Taux de complétion</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] ${subTextClasses}`}>Terminées</span>
                <span className={`text-[10px] font-medium ${headingClasses}`}>{demandesTerminees}</span>
              </div>
              <div className="relative h-2 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(226, 232, 240, 1)' }}>
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                  style={{
                    width: `${totalDemandes > 0 ? (demandesTerminees / totalDemandes) * 100 : 0}%`,
                    boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)'
                  }}
                ></div>
              </div>
              <div className={`text-xl font-bold ${text('text-emerald-600', 'text-emerald-600')}`}>
                {totalDemandes > 0 ? ((demandesTerminees / totalDemandes) * 100).toFixed(0) : 0}%
              </div>
            </div>
          </div>

          {/* Demandes prioritaires */}
          <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-xl p-4`}>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-orange-600" />
              <h3 className={`text-sm font-semibold ${headingClasses}`}>Priorité haute</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] ${subTextClasses}`}>Demandes urgentes</span>
                <span className={`text-[10px] font-medium ${headingClasses}`}>
                  {caseFiles.filter(cf => cf.priority === 'high').length}
                </span>
              </div>
              <div className={`text-xl font-bold ${text('text-orange-600', 'text-orange-600')}`}>
                {caseFiles.filter(cf => cf.priority === 'high').length}
              </div>
              <div className={`text-[10px] ${subTextClasses}`}>Nécessitent une attention immédiate</div>
            </div>
          </div>

          {/* Temps moyen */}
          <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-xl p-4`}>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <h3 className={`text-sm font-semibold ${headingClasses}`}>Temps moyen</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] ${subTextClasses}`}>Traitement</span>
                <span className={`text-[10px] font-medium ${headingClasses}`}>~5.2 jours</span>
              </div>
              <div className={`text-xl font-bold ${text('text-blue-600', 'text-blue-600')}`}>
                5.2j
              </div>
              <div className={`text-[10px] ${subTextClasses}`}>De la demande à la clôture</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Composant Dashboard des Ventes
  const SalesDashboardTab = () => {
    const currentYear = new Date().getFullYear();
    const [viewMode, setViewMode] = useState<'week' | 'month' | 'year'>('month');
    const [selectedPeriod, setSelectedPeriod] = useState<'current' | 'previous'>('current');

    // Données simulées par période (ces données devraient venir de l'API)
    const dataByPeriod = {
      week: {
        current: [
          { period: 'S1', ventes: 12, ca: 4500, panierMoyen: 375, unites: 28 },
          { period: 'S2', ventes: 15, ca: 5800, panierMoyen: 387, unites: 35 },
          { period: 'S3', ventes: 18, ca: 6200, panierMoyen: 344, unites: 42 },
          { period: 'S4', ventes: 14, ca: 5100, panierMoyen: 364, unites: 32 },
        ],
        previous: [
          { period: 'S1', ventes: 10, ca: 3800, panierMoyen: 380, unites: 25 },
          { period: 'S2', ventes: 13, ca: 5200, panierMoyen: 400, unites: 30 },
          { period: 'S3', ventes: 16, ca: 5600, panierMoyen: 350, unites: 38 },
          { period: 'S4', ventes: 12, ca: 4500, panierMoyen: 375, unites: 28 },
        ]
      },
      month: {
        current: [
          { period: 'Jan', ventes: 45, ca: 18500, panierMoyen: 411, unites: 98, gradeA: 35, gradeB: 40, gradeC: 20, gradeD: 5 },
          { period: 'Fév', ventes: 52, ca: 21200, panierMoyen: 408, unites: 115, gradeA: 38, gradeB: 42, gradeC: 15, gradeD: 5 },
          { period: 'Mar', ventes: 58, ca: 24800, panierMoyen: 428, unites: 128, gradeA: 40, gradeB: 38, gradeC: 18, gradeD: 4 },
          { period: 'Avr', ventes: 48, ca: 19600, panierMoyen: 408, unites: 102, gradeA: 36, gradeB: 40, gradeC: 20, gradeD: 4 },
          { period: 'Mai', ventes: 62, ca: 26500, panierMoyen: 427, unites: 138, gradeA: 42, gradeB: 38, gradeC: 16, gradeD: 4 },
          { period: 'Juin', ventes: 55, ca: 23400, panierMoyen: 425, unites: 122, gradeA: 39, gradeB: 39, gradeC: 18, gradeD: 4 },
          { period: 'Juil', ventes: 50, ca: 20800, panierMoyen: 416, unites: 110, gradeA: 37, gradeB: 40, gradeC: 19, gradeD: 4 },
          { period: 'Août', ventes: 42, ca: 17200, panierMoyen: 410, unites: 92, gradeA: 34, gradeB: 41, gradeC: 20, gradeD: 5 },
          { period: 'Sep', ventes: 59, ca: 25200, panierMoyen: 427, unites: 132, gradeA: 41, gradeB: 38, gradeC: 17, gradeD: 4 },
          { period: 'Oct', ventes: 65, ca: 28400, panierMoyen: 437, unites: 145, gradeA: 43, gradeB: 37, gradeC: 16, gradeD: 4 },
        ],
        previous: [
          { period: 'Jan', ventes: 38, ca: 15500, panierMoyen: 408, unites: 85, gradeA: 32, gradeB: 42, gradeC: 22, gradeD: 4 },
          { period: 'Fév', ventes: 45, ca: 18200, panierMoyen: 404, unites: 98, gradeA: 35, gradeB: 40, gradeC: 20, gradeD: 5 },
          { period: 'Mar', ventes: 50, ca: 21000, panierMoyen: 420, unites: 108, gradeA: 38, gradeB: 39, gradeC: 19, gradeD: 4 },
          { period: 'Avr', ventes: 42, ca: 17800, panierMoyen: 424, unites: 92, gradeA: 34, gradeB: 41, gradeC: 21, gradeD: 4 },
          { period: 'Mai', ventes: 55, ca: 23500, panierMoyen: 427, unites: 120, gradeA: 40, gradeB: 38, gradeC: 18, gradeD: 4 },
          { period: 'Juin', ventes: 48, ca: 20400, panierMoyen: 425, unites: 105, gradeA: 37, gradeB: 39, gradeC: 20, gradeD: 4 },
          { period: 'Juil', ventes: 44, ca: 18600, panierMoyen: 423, unites: 96, gradeA: 35, gradeB: 40, gradeC: 21, gradeD: 4 },
          { period: 'Août', ventes: 36, ca: 14800, panierMoyen: 411, unites: 78, gradeA: 31, gradeB: 42, gradeC: 22, gradeD: 5 },
          { period: 'Sep', ventes: 52, ca: 22400, panierMoyen: 431, unites: 115, gradeA: 39, gradeB: 38, gradeC: 19, gradeD: 4 },
          { period: 'Oct', ventes: 58, ca: 25200, panierMoyen: 434, unites: 128, gradeA: 41, gradeB: 37, gradeC: 18, gradeD: 4 },
          { period: 'Nov', ventes: 51, ca: 21800, panierMoyen: 427, unites: 112, gradeA: 38, gradeB: 39, gradeC: 19, gradeD: 4 },
          { period: 'Déc', ventes: 46, ca: 19400, panierMoyen: 422, unites: 100, gradeA: 36, gradeB: 40, gradeC: 20, gradeD: 4 },
        ]
      },
      year: {
        current: [
          { period: '2021', ventes: 520, ca: 205000, panierMoyen: 394, unites: 1150, gradeA: 30, gradeB: 42, gradeC: 23, gradeD: 5 },
          { period: '2022', ventes: 585, ca: 238000, panierMoyen: 407, unites: 1295, gradeA: 34, gradeB: 40, gradeC: 21, gradeD: 5 },
          { period: '2023', ventes: 642, ca: 268000, panierMoyen: 417, unites: 1420, gradeA: 37, gradeB: 39, gradeC: 20, gradeD: 4 },
          { period: '2024', ventes: 695, ca: 298000, panierMoyen: 429, unites: 1540, gradeA: 40, gradeB: 38, gradeC: 18, gradeD: 4 },
          { period: '2025', ventes: 536, ca: 231000, panierMoyen: 431, unites: 1192, gradeA: 40, gradeB: 39, gradeC: 17, gradeD: 4 },
        ]
      }
    };

    // Sélectionner les données en fonction du mode de vue et de la période
    const getChartData = () => {
      if (viewMode === 'year') return dataByPeriod.year.current;
      return dataByPeriod[viewMode][selectedPeriod as 'current' | 'previous'];
    };

    const chartData = getChartData();
    const maxVentes = Math.max(...chartData.map(m => m.ventes));
    const maxCA = Math.max(...chartData.map(m => m.ca));

    // Calculer les KPIs totaux
    const totalVentes = chartData.reduce((sum, d) => sum + d.ventes, 0);
    const totalCA = chartData.reduce((sum, d) => sum + d.ca, 0);
    const panierMoyen = totalVentes > 0 ? Math.round(totalCA / totalVentes) : 0;
    const totalUnites = chartData.reduce((sum, d) => sum + d.unites, 0);
    const unitesParVente = totalVentes > 0 ? (totalUnites / totalVentes).toFixed(1) : '0';

    // Calculer la répartition par grade (seulement pour le mode mois et année)
    const gradeData = viewMode !== 'week' && chartData.length > 0 && 'gradeA' in chartData[0] ? {
      A: Math.round(chartData.reduce((sum: number, d: any) => sum + (d.gradeA || 0), 0) / chartData.length),
      B: Math.round(chartData.reduce((sum: number, d: any) => sum + (d.gradeB || 0), 0) / chartData.length),
      C: Math.round(chartData.reduce((sum: number, d: any) => sum + (d.gradeC || 0), 0) / chartData.length),
      D: Math.round(chartData.reduce((sum: number, d: any) => sum + (d.gradeD || 0), 0) / chartData.length),
    } : null;

    // Obtenir le label de période
    const getPeriodLabel = () => {
      if (viewMode === 'week') return selectedPeriod === 'current' ? 'Mois en cours' : 'Mois dernier';
      if (viewMode === 'month') return selectedPeriod === 'current' ? `Année ${currentYear}` : `Année ${currentYear - 1}`;
      return 'Historique 5 ans';
    };

    return (
      <div className="space-y-6">
        {/* En-tête Dashboard avec sélecteur de période */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          <div>
            <h2 className={`text-xl font-bold ${headingClasses} flex items-center gap-2`}>
              <ShoppingCart className="w-6 h-6 text-cyan-600" />
              Dashboard Ventes - {getPeriodLabel()}
            </h2>
            <p className={`mt-0.5 text-xs ${subTextClasses}`}>Vue d'ensemble des performances commerciales</p>
          </div>

          {/* Sélecteur de vue stylé */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Sélecteur de mode (Semaine/Mois/Année) */}
            <div className={`inline-flex items-center ${bg('bg-slate-800/50', 'bg-gray-100')} p-1 rounded-xl border ${border('border-slate-700', 'border-gray-200')} backdrop-blur-sm`}>
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                  viewMode === 'week'
                    ? `${bg('bg-gradient-to-r from-purple-600 to-purple-500', 'bg-purple-600')} text-white shadow-lg shadow-purple-500/50`
                    : `${text('text-slate-400', 'text-gray-600')} hover:${text('text-slate-300', 'text-gray-900')}`
                }`}
              >
                <Calendar className="w-4 h-4" />
                Semaine
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                  viewMode === 'month'
                    ? `${bg('bg-gradient-to-r from-cyan-600 to-cyan-500', 'bg-cyan-600')} text-white shadow-lg shadow-cyan-500/50`
                    : `${text('text-slate-400', 'text-gray-600')} hover:${text('text-slate-300', 'text-gray-900')}`
                }`}
              >
                <Calendar className="w-4 h-4" />
                Mois
              </button>
              <button
                onClick={() => setViewMode('year')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                  viewMode === 'year'
                    ? `${bg('bg-gradient-to-r from-emerald-600 to-emerald-500', 'bg-emerald-600')} text-white shadow-lg shadow-emerald-500/50`
                    : `${text('text-slate-400', 'text-gray-600')} hover:${text('text-slate-300', 'text-gray-900')}`
                }`}
              >
                <Calendar className="w-4 h-4" />
                Année
              </button>
            </div>

            {/* Sélecteur de période (En cours/Précédent) */}
            {viewMode !== 'year' && (
              <div className={`inline-flex items-center ${bg('bg-slate-800/50', 'bg-gray-100')} p-1 rounded-xl border ${border('border-slate-700', 'border-gray-200')} backdrop-blur-sm`}>
                <button
                  onClick={() => setSelectedPeriod('current')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                    selectedPeriod === 'current'
                      ? `${bg('bg-gradient-to-r from-blue-600 to-blue-500', 'bg-blue-600')} text-white shadow-lg shadow-blue-500/50`
                      : `${text('text-slate-400', 'text-gray-600')} hover:${text('text-slate-300', 'text-gray-900')}`
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  En cours
                </button>
                <button
                  onClick={() => setSelectedPeriod('previous')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                    selectedPeriod === 'previous'
                      ? `${bg('bg-gradient-to-r from-orange-600 to-orange-500', 'bg-orange-600')} text-white shadow-lg shadow-orange-500/50`
                      : `${text('text-slate-400', 'text-gray-600')} hover:${text('text-slate-300', 'text-gray-900')}`
                  }`}
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  Précédent
                </button>
              </div>
            )}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Total Ventes */}
          <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-lg p-3 relative overflow-hidden group hover:shadow-md hover:shadow-purple-500/20 transition-all`}>
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-xl group-hover:scale-125 transition-transform"></div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`p-1.5 rounded ${bg('bg-purple-500/20', 'bg-purple-100')}`}>
                  <ShoppingCart className="w-3.5 h-3.5 text-purple-600" />
                </div>
                <div className={`text-[10px] ${subTextClasses} uppercase tracking-wide font-medium`}>Total</div>
              </div>
              <div className={`text-2xl font-bold ${text('text-purple-600', 'text-purple-600')} mb-0.5`}>{totalVentes}</div>
              <div className={`text-[10px] ${subTextClasses}`}>Ventes</div>
              <div className="mt-1.5 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-600 text-[10px] font-medium">+18%</span>
              </div>
            </div>
          </div>

          {/* CA TTC */}
          <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-lg p-3 relative overflow-hidden group hover:shadow-md hover:shadow-emerald-500/20 transition-all`}>
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-xl group-hover:scale-125 transition-transform"></div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`p-1.5 rounded ${bg('bg-emerald-500/20', 'bg-emerald-100')}`}>
                  <Euro className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className={`text-[10px] ${subTextClasses} uppercase tracking-wide font-medium`}>CA TTC</div>
              </div>
              <div className={`text-2xl font-bold ${text('text-emerald-600', 'text-emerald-600')} mb-0.5`}>{totalCA.toLocaleString()} €</div>
              <div className={`text-[10px] ${subTextClasses}`}>Chiffre d'affaires</div>
              <div className="mt-1.5 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-600 text-[10px] font-medium">+22%</span>
              </div>
            </div>
          </div>

          {/* Panier Moyen */}
          <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-lg p-3 relative overflow-hidden group hover:shadow-md hover:shadow-blue-500/20 transition-all`}>
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-xl group-hover:scale-125 transition-transform"></div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`p-1.5 rounded ${bg('bg-blue-500/20', 'bg-blue-100')}`}>
                  <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className={`text-[10px] ${subTextClasses} uppercase tracking-wide font-medium`}>Panier</div>
              </div>
              <div className={`text-2xl font-bold ${text('text-blue-600', 'text-blue-600')} mb-0.5`}>{panierMoyen} €</div>
              <div className={`text-[10px] ${subTextClasses}`}>Moyen</div>
              <div className="mt-1.5 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-blue-600" />
                <span className="text-blue-600 text-[10px] font-medium">+3%</span>
              </div>
            </div>
          </div>

          {/* Unités par Vente */}
          <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-lg p-3 relative overflow-hidden group hover:shadow-md hover:shadow-cyan-500/20 transition-all`}>
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-xl group-hover:scale-125 transition-transform"></div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`p-1.5 rounded ${bg('bg-cyan-500/20', 'bg-cyan-100')}`}>
                  <Package className="w-3.5 h-3.5 text-cyan-600" />
                </div>
                <div className={`text-[10px] ${subTextClasses} uppercase tracking-wide font-medium`}>Unités</div>
              </div>
              <div className={`text-2xl font-bold ${text('text-cyan-600', 'text-cyan-600')} mb-0.5`}>{unitesParVente}</div>
              <div className={`text-[10px] ${subTextClasses}`}>Par vente</div>
              <div className="mt-1.5 flex items-center gap-1">
                <span className="text-cyan-600 text-[10px] font-medium">{totalUnites} unités</span>
              </div>
            </div>
          </div>
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Graphique Nombre de Ventes */}
          <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-xl p-4`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-sm font-semibold ${headingClasses} flex items-center gap-2`}>
                <ShoppingCart className="w-4 h-4 text-purple-600" />
                Nombre de Ventes {viewMode === 'week' ? 'par semaine' : viewMode === 'month' ? 'par mois' : 'par année'}
              </h3>
              <div className={`px-2 py-0.5 rounded-lg ${bg('bg-purple-500/10', 'bg-purple-50')} text-purple-600 text-[10px] font-medium`}>
                {totalVentes} total
              </div>
            </div>

            <div className="space-y-2">
              {chartData.map((data, index) => (
                <div key={data.period} className="flex items-center gap-2">
                  <div className={`w-10 text-[10px] ${subTextClasses} font-medium`}>{data.period}</div>
                  <div className="flex-1 relative h-6 rounded-lg overflow-hidden" style={{ background: isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(226, 232, 240, 1)' }}>
                    <div
                      className="absolute inset-y-0 left-0 rounded-lg transition-all duration-700 ease-out"
                      style={{
                        width: `${(data.ventes / maxVentes) * 100}%`,
                        background: isDark
                          ? 'linear-gradient(90deg, rgba(168, 85, 247, 0.8) 0%, rgba(139, 92, 246, 0.6) 100%)'
                          : 'linear-gradient(90deg, rgba(168, 85, 247, 0.9) 0%, rgba(139, 92, 246, 0.7) 100%)',
                        boxShadow: isDark ? '0 0 15px rgba(168, 85, 247, 0.4)' : '0 0 8px rgba(168, 85, 247, 0.3)',
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                    </div>
                    <div className={`absolute inset-0 flex items-center px-2 text-xs font-bold ${text('text-white', 'text-purple-900')}`}>
                      {data.ventes}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Graphique CA */}
          <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-xl p-4`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-sm font-semibold ${headingClasses} flex items-center gap-2`}>
                <Euro className="w-4 h-4 text-emerald-600" />
                Chiffre d'Affaires (€)
              </h3>
              <div className={`px-2 py-0.5 rounded-lg ${bg('bg-emerald-500/10', 'bg-emerald-50')} text-emerald-600 text-[10px] font-medium`}>
                {totalCA.toLocaleString()} €
              </div>
            </div>

            <div className="space-y-2">
              {chartData.map((data, index) => (
                <div key={data.period} className="flex items-center gap-2">
                  <div className={`w-10 text-[10px] ${subTextClasses} font-medium`}>{data.period}</div>
                  <div className="flex-1 relative h-6 rounded-lg overflow-hidden" style={{ background: isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(226, 232, 240, 1)' }}>
                    <div
                      className="absolute inset-y-0 left-0 rounded-lg transition-all duration-700 ease-out"
                      style={{
                        width: `${(data.ca / maxCA) * 100}%`,
                        background: isDark
                          ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.8) 0%, rgba(5, 150, 105, 0.6) 100%)'
                          : 'linear-gradient(90deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.7) 100%)',
                        boxShadow: isDark ? '0 0 15px rgba(16, 185, 129, 0.4)' : '0 0 8px rgba(16, 185, 129, 0.3)',
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                    </div>
                    <div className={`absolute inset-0 flex items-center px-2 text-xs font-bold ${text('text-white', 'text-emerald-900')}`}>
                      {data.ca.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Statistiques supplémentaires */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Répartition par Grade */}
          {gradeData && (
            <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-xl p-4`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-sm font-semibold ${headingClasses} flex items-center gap-2`}>
                  <Award className="w-4 h-4 text-amber-600" />
                  Répartition par Grade
                </h3>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] ${subTextClasses} flex items-center gap-1`}>
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      Grade A
                    </span>
                    <span className={`text-xs font-bold text-emerald-600`}>{gradeData.A}%</span>
                  </div>
                  <div className="relative h-4 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(226, 232, 240, 1)' }}>
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                      style={{
                        width: `${gradeData.A}%`,
                        background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.7) 100%)',
                        boxShadow: isDark ? '0 0 12px rgba(16, 185, 129, 0.5)' : '0 0 6px rgba(16, 185, 129, 0.3)',
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] ${subTextClasses} flex items-center gap-1`}>
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      Grade B
                    </span>
                    <span className={`text-xs font-bold text-blue-600`}>{gradeData.B}%</span>
                  </div>
                  <div className="relative h-4 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(226, 232, 240, 1)' }}>
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                      style={{
                        width: `${gradeData.B}%`,
                        background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.9) 0%, rgba(37, 99, 235, 0.7) 100%)',
                        boxShadow: isDark ? '0 0 12px rgba(59, 130, 246, 0.5)' : '0 0 6px rgba(59, 130, 246, 0.3)',
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] ${subTextClasses} flex items-center gap-1`}>
                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                      Grade C
                    </span>
                    <span className={`text-xs font-bold text-orange-500`}>{gradeData.C}%</span>
                  </div>
                  <div className="relative h-4 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(226, 232, 240, 1)' }}>
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                      style={{
                        width: `${gradeData.C}%`,
                        background: 'linear-gradient(90deg, rgba(249, 115, 22, 0.9) 0%, rgba(234, 88, 12, 0.7) 100%)',
                        boxShadow: isDark ? '0 0 12px rgba(249, 115, 22, 0.5)' : '0 0 6px rgba(249, 115, 22, 0.3)',
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] ${subTextClasses} flex items-center gap-1`}>
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      Grade D
                    </span>
                    <span className={`text-xs font-bold text-red-500`}>{gradeData.D}%</span>
                  </div>
                  <div className="relative h-4 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(226, 232, 240, 1)' }}>
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                      style={{
                        width: `${gradeData.D}%`,
                        background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.9) 0%, rgba(220, 38, 38, 0.7) 100%)',
                        boxShadow: isDark ? '0 0 12px rgba(239, 68, 68, 0.5)' : '0 0 6px rgba(239, 68, 68, 0.3)',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Top Canaux de Vente */}
          <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-xl p-4`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-sm font-semibold ${headingClasses} flex items-center gap-2`}>
                <Store className="w-4 h-4 text-blue-600" />
                Canaux de Vente
              </h3>
            </div>
            <div className="space-y-2">
              {[
                { name: 'Site Web', percent: 42, color: 'rgba(59, 130, 246, 0.8)' },
                { name: 'Marketplace', percent: 35, color: 'rgba(99, 102, 241, 0.8)' },
                { name: 'Magasin', percent: 18, color: 'rgba(139, 92, 246, 0.8)' },
                { name: 'Autres', percent: 5, color: 'rgba(168, 85, 247, 0.8)' },
              ].map((channel) => (
                <div key={channel.name}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-[10px] ${subTextClasses}`}>{channel.name}</span>
                    <span className={`text-[10px] font-medium ${headingClasses}`}>{channel.percent}%</span>
                  </div>
                  <div className="relative h-3 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(226, 232, 240, 1)' }}>
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                      style={{
                        width: `${channel.percent}%`,
                        background: channel.color,
                        boxShadow: isDark ? `0 0 10px ${channel.color}` : `0 0 5px ${channel.color}`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tendances */}
          <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-xl p-4`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-sm font-semibold ${headingClasses} flex items-center gap-2`}>
                <TrendingUp className="w-4 h-4 text-rose-600" />
                Tendances
              </h3>
            </div>
            <div className="space-y-3">
              <div className={`p-2 rounded-lg ${bg('bg-emerald-500/10', 'bg-emerald-50')}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] ${subTextClasses}`}>Ventes</span>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-600 text-xs font-bold">+18%</span>
                  </div>
                </div>
                <div className={`text-xs ${text('text-emerald-700', 'text-emerald-700')}`}>vs période précédente</div>
              </div>
              <div className={`p-2 rounded-lg ${bg('bg-emerald-500/10', 'bg-emerald-50')}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] ${subTextClasses}`}>CA</span>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-600 text-xs font-bold">+22%</span>
                  </div>
                </div>
                <div className={`text-xs ${text('text-emerald-700', 'text-emerald-700')}`}>vs période précédente</div>
              </div>
              <div className={`p-2 rounded-lg ${bg('bg-blue-500/10', 'bg-blue-50')}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] ${subTextClasses}`}>Panier</span>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-blue-600" />
                    <span className="text-blue-600 text-xs font-bold">+3%</span>
                  </div>
                </div>
                <div className={`text-xs ${text('text-blue-700', 'text-blue-700')}`}>vs période précédente</div>
              </div>
            </div>
          </div>
        </div>

        {/* Ventes par Dossier - Top 5 */}
        <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-xl p-4`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-semibold ${headingClasses} flex items-center gap-2`}>
              <FileText className="w-4 h-4 text-purple-600" />
              Top 5 - Ventes par Dossier
            </h3>
            {/* Switch pour changer le type de tri */}
            <div className={`flex items-center gap-2 ${bg('bg-slate-800/50', 'bg-gray-100')} rounded-lg p-1`}>
              <button
                onClick={() => setTop5SortBy('value')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  top5SortBy === 'value'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : `${text('text-slate-400', 'text-gray-600')} hover:${text('text-slate-300', 'text-gray-800')}`
                }`}
              >
                Valeur
              </button>
              <button
                onClick={() => setTop5SortBy('percentage')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  top5SortBy === 'percentage'
                    ? 'bg-purple-600 text-white shadow-md'
                    : `${text('text-slate-400', 'text-gray-600')} hover:${text('text-slate-300', 'text-gray-800')}`
                }`}
              >
                %
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {salesCaseFiles
              .sort((a: any, b: any) => {
                if (top5SortBy === 'value') {
                  return (b.stats?.totalRevenue || 0) - (a.stats?.totalRevenue || 0);
                } else {
                  return (b.stats?.salesRate || 0) - (a.stats?.salesRate || 0);
                }
              })
              .slice(0, 5)
              .map((dossier: any) => (
              <button
                key={dossier.id}
                onClick={() => setSelectedSaleCaseFile(dossier.id)}
                className={`w-full text-left ${bg('bg-slate-800/50 hover:bg-slate-700/50', 'bg-gray-50 hover:bg-gray-100')} ${border('border-slate-700', 'border-gray-200')} border rounded-lg p-3 transition-colors cursor-pointer`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className={`font-medium ${text('text-white', 'text-gray-900')}`}>{dossier.reference}</div>
                    <div className={`text-xs ${text('text-slate-400', 'text-gray-600')} mt-0.5`}>{dossier.request?.client?.raisonSociale || 'Client inconnu'}</div>
                  </div>
                  <div className="text-right">
                    {top5SortBy === 'value' ? (
                      <>
                        <div className={`text-sm font-bold text-emerald-600`}>{(dossier.stats?.totalRevenue || 0).toLocaleString()} €</div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-600">
                            {dossier.stats?.totalVentes || 0} ventes
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className={`text-lg font-bold text-purple-600`}>{dossier.stats?.salesRate || 0}%</div>
                        <div className={`text-xs ${text('text-slate-400', 'text-gray-600')} mt-0.5`}>
                          {(dossier.stats?.totalRevenue || 0).toLocaleString()} €
                        </div>
                      </>
                    )}
                  </div>
                </div>
                {top5SortBy === 'percentage' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] ${subTextClasses}`}>Taux de vente</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-600">
                        {dossier.stats?.totalVentes || 0} ventes
                      </span>
                    </div>
                    <div className="relative h-2 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(226, 232, 240, 1)' }}>
                      <div
                        className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                        style={{
                          width: `${dossier.stats?.salesRate || 0}%`,
                          background: 'linear-gradient(90deg, rgba(168, 85, 247, 0.9) 0%, rgba(124, 58, 237, 0.7) 100%)',
                          boxShadow: isDark ? '0 0 10px rgba(168, 85, 247, 0.5)' : '0 0 5px rgba(168, 85, 247, 0.3)',
                        }}
                      />
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Composant panneau de démantèlement
  const DismantlingPanel = () => {
    if (!selectedLotForDismantling) return null;

    const lot = selectedLotForDismantling;

    // Debug: afficher les infos du lot
    console.log('Lot sélectionné:', lot);
    console.log('Données de démantèlement:', dismantlingData);

    // Trouver la configuration de démantèlement
    let dismantlingConfig: any = null;
    let matchedSubCategory: any = null;
    let matchedCategory: any = null;

    const lotCategoryName = lot.categorieName?.toLowerCase().trim() || '';
    console.log('🔍 Recherche config pour:', lotCategoryName);

    // Fonction pour normaliser et comparer les noms
    const normalizeString = (str: string) => {
      return str
        .toLowerCase()
        .trim()
        .replace(/[éèêë]/g, 'e')
        .replace(/[àâä]/g, 'a')
        .replace(/[ôö]/g, 'o')
        .replace(/[îï]/g, 'i')
        .replace(/[ùûü]/g, 'u')
        .replace(/[ç]/g, 'c')
        .replace(/\s+/g, ' ')
        .replace(/[\/\-\(\)]/g, ' ');
    };

    // Fonction de calcul de similarité entre deux chaînes
    const calculateSimilarity = (str1: string, str2: string): number => {
      const normalized1 = normalizeString(str1);
      const normalized2 = normalizeString(str2);

      let score = 0;

      // Match exact = score maximum
      if (normalized1 === normalized2) {
        score += 1000;
      }

      // Extraire les mots clés importants
      const words1 = normalized1.split(' ').filter(w => w.length > 2);
      const words2 = normalized2.split(' ').filter(w => w.length > 2);

      // Compter les mots en commun
      for (const word1 of words1) {
        for (const word2 of words2) {
          if (word1 === word2) {
            score += word1.length * 10; // Plus le mot est long, plus il est significatif
          } else if (word1.includes(word2) || word2.includes(word1)) {
            score += Math.min(word1.length, word2.length) * 5;
          }
        }
      }

      // Vérifier si l'un est contenu dans l'autre
      if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
        score += 50;
      }

      return score;
    };

    // Parcourir TOUTES les sous-catégories de TOUTES les catégories
    let bestMatch: any = null;
    let bestScore = 0;
    let bestParentCategory: any = null;

    for (const category of dismantlingData) {
      if (!category.children || !Array.isArray(category.children)) continue;

      for (const subCategory of category.children) {
        if (!subCategory.dismantling) continue; // Ignorer les sous-catégories sans config

        const subCatLabel = subCategory.label || '';
        const score = calculateSimilarity(lotCategoryName, subCatLabel);

        console.log(`  📊 ${subCatLabel}: score = ${score}`);

        if (score > bestScore) {
          bestScore = score;
          bestMatch = subCategory;
          bestParentCategory = category;
        }
      }
    }

    // Seuil minimum de score pour accepter un match (évite les faux positifs)
    const MINIMUM_SCORE = 20;

    if (bestMatch && bestScore >= MINIMUM_SCORE) {
      dismantlingConfig = bestMatch.dismantling;
      matchedSubCategory = bestMatch;
      matchedCategory = bestParentCategory;
      console.log('✅ Configuration trouvée:', bestMatch.label, '(score:', bestScore, ')');
      console.log('   Catégorie parente:', bestParentCategory.label);
    } else {
      console.warn('❌ Aucune configuration trouvée pour:', lotCategoryName, '(meilleur score:', bestScore, ')');
    }

    return (
      <>
        {/* Overlay */}
        <div
          className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${
            isDismantlingPanelOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setIsDismantlingPanelOpen(false)}
        ></div>

        {/* Panel coulissant */}
        <div
          className={`fixed top-0 right-0 h-full ${bg('bg-slate-900', 'bg-white')} shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
            isDismantlingPanelOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{ width: '80%' }}
        >
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className={`${bg('bg-slate-800', 'bg-gray-50')} ${border('border-b-slate-700', 'border-b-gray-200')} border-b p-6`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${bg('bg-gradient-to-br from-purple-600 to-purple-500', 'bg-purple-100')} shadow-lg shadow-purple-500/30`}>
                    <Split className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className={`text-2xl font-bold ${headingClasses}`}>Démantèlement du Lot</h2>
                    <p className={`text-sm ${subTextClasses} mt-1`}>
                      Éclatement en sous-composants • {lot.code}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDismantlingPanelOpen(false)}
                  className={`p-2 rounded-lg ${bg('hover:bg-slate-700', 'hover:bg-gray-200')} transition-colors`}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Tabs Navigation */}
              <div className={`flex gap-2 ${bg('bg-slate-900/50', 'bg-gray-100')} p-1 rounded-xl border ${border('border-slate-700', 'border-gray-200')}`}>
                <button
                  onClick={() => setDismantlingPanelTab('dismantling')}
                  className={`flex-1 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                    dismantlingPanelTab === 'dismantling'
                      ? `${bg('bg-gradient-to-r from-purple-600 to-purple-500', 'bg-purple-600')} text-white shadow-lg shadow-purple-500/50`
                      : isDark
                        ? 'text-slate-400 hover:text-slate-300'
                        : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Split className="w-4 h-4" />
                  Démantèlement
                </button>
                <button
                  onClick={() => setDismantlingPanelTab('checklist')}
                  className={`flex-1 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                    dismantlingPanelTab === 'checklist'
                      ? `${bg('bg-gradient-to-r from-purple-600 via-purple-500 to-cyan-500', 'bg-purple-600')} text-white shadow-lg shadow-purple-500/50`
                      : isDark
                        ? 'text-slate-400 hover:text-slate-300'
                        : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  Checklist IA
                </button>
              </div>
            </div>

            {/* Content */}
            <div className={`flex-1 overflow-y-auto p-6 ${isDark ? 'custom-scrollbar-dark' : 'custom-scrollbar-light'}`}>
              {/* Onglet Démantèlement */}
              {dismantlingPanelTab === 'dismantling' && (
                <div className="space-y-6">
                  {/* Info du lot */}
                  <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-xl p-6`}>
                  <h3 className={`text-lg font-semibold ${headingClasses} mb-4 flex items-center gap-2`}>
                    <Package className="w-5 h-5 text-purple-600" />
                    Information du Lot
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className={`text-xs ${subTextClasses} mb-1`}>Code Lot</div>
                      <div className={`font-mono font-bold ${headingClasses}`}>{lot.code}</div>
                    </div>
                    <div>
                      <div className={`text-xs ${subTextClasses} mb-1`}>Catégorie</div>
                      <div className={`font-medium ${headingClasses}`}>{lot.categorieName}</div>
                    </div>
                    <div>
                      <div className={`text-xs ${subTextClasses} mb-1`}>Grade</div>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getGradeColor(lot.grade)}`}>
                        Grade {lot.grade}
                      </span>
                    </div>
                    <div>
                      <div className={`text-xs ${subTextClasses} mb-1`}>Poids</div>
                      <div className={`font-bold ${headingClasses}`}>{lot.poidsReel || lot.poidsEstime || 0} kg</div>
                    </div>
                  </div>
                </div>

                {/* Configuration de démantèlement */}
                {dismantlingConfig ? (
                  <>
                    {/* Info de matching */}
                    {matchedSubCategory && (
                      <div className={`${bg('bg-blue-500/10', 'bg-blue-50')} ${border('border-blue-500/30', 'border-blue-200')} border rounded-xl p-4`}>
                        <div className="flex items-center gap-2">
                          <Info className="w-4 h-4 text-blue-600" />
                          <span className={`text-sm ${text('text-blue-700', 'text-blue-700')}`}>
                            Configuration: <strong>{matchedSubCategory.label}</strong>
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Sous-ensembles */}
                    <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-xl p-6`}>
                      <h3 className={`text-lg font-semibold ${headingClasses} mb-4 flex items-center gap-2`}>
                        <Layers className="w-5 h-5 text-cyan-600" />
                        Sous-ensembles à Créer
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {dismantlingConfig.subassemblies.map((subassembly: string, index: number) => (
                          <div
                            key={index}
                            className={`p-4 rounded-lg ${bg('bg-slate-800/50', 'bg-gray-50')} ${border('border-slate-700', 'border-gray-200')} border ${bg('hover:bg-slate-700/50', 'hover:bg-gray-100')} transition-all cursor-pointer group`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`mt-0.5 w-6 h-6 rounded-full ${bg('bg-cyan-500/20', 'bg-cyan-100')} flex items-center justify-center flex-shrink-0`}>
                                <ChevronRight className="w-4 h-4 text-cyan-600" />
                              </div>
                              <div className="flex-1">
                                <div className={`font-medium ${headingClasses} group-hover:text-cyan-600 transition-colors`}>
                                  {subassembly}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Matières valorisables */}
                    {dismantlingConfig.valuable && dismantlingConfig.valuable.length > 0 && (
                      <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-xl p-6`}>
                        <h3 className={`text-lg font-semibold ${headingClasses} mb-4 flex items-center gap-2`}>
                          <TrendingUp className="w-5 h-5 text-emerald-600" />
                          Matières Valorisables
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {dismantlingConfig.valuable.map((material: string, index: number) => (
                            <span
                              key={index}
                              className={`px-3 py-2 rounded-lg ${bg('bg-emerald-500/20', 'bg-emerald-100')} ${border('border-emerald-500/30', 'border-emerald-200')} border text-emerald-600 text-sm font-medium`}
                            >
                              {material}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Matières dangereuses */}
                    {dismantlingConfig.hazardous && dismantlingConfig.hazardous.length > 0 && (
                      <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-xl p-6`}>
                        <h3 className={`text-lg font-semibold ${headingClasses} mb-4 flex items-center gap-2`}>
                          <AlertCircle className="w-5 h-5 text-red-600" />
                          Matières Dangereuses
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {dismantlingConfig.hazardous.map((hazard: string, index: number) => (
                            <span
                              key={index}
                              className={`px-3 py-2 rounded-lg ${bg('bg-red-500/20', 'bg-red-100')} ${border('border-red-500/30', 'border-red-200')} border text-red-600 text-sm font-medium`}
                            >
                              {hazard}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {dismantlingConfig.notes && (
                      <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-xl p-6`}>
                        <h3 className={`text-lg font-semibold ${headingClasses} mb-4 flex items-center gap-2`}>
                          <Info className="w-5 h-5 text-blue-600" />
                          Notes et Recommandations
                        </h3>
                        <p className={`${text('text-slate-300', 'text-gray-700')} leading-relaxed`}>
                          {dismantlingConfig.notes}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        onClick={() => setIsDismantlingPanelOpen(false)}
                        className={`px-6 py-3 rounded-lg ${bg('bg-slate-700', 'bg-gray-200')} ${text('text-slate-300', 'text-gray-700')} hover:${bg('bg-slate-600', 'bg-gray-300')} transition-colors font-medium`}
                      >
                        Annuler
                      </button>
                      <button
                        onClick={async () => {
                          // TODO: Implémenter la création des composants
                          alert('Fonctionnalité de création des composants à implémenter');
                          setIsDismantlingPanelOpen(false);
                        }}
                        className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-700 hover:to-purple-600 transition-all font-medium shadow-lg shadow-purple-500/30"
                      >
                        <div className="flex items-center gap-2">
                          <Split className="w-5 h-5" />
                          Créer les Composants
                        </div>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20">
                    <AlertCircle className="w-16 h-16 text-orange-600 mb-4" />
                    <h3 className={`text-lg font-semibold ${headingClasses} mb-2`}>
                      Configuration non disponible
                    </h3>
                    <p className={`text-sm ${subTextClasses} text-center max-w-md`}>
                      Aucune configuration de démantèlement n'est disponible pour cette sous-catégorie.
                      Veuillez vérifier la catégorie du lot.
                    </p>
                  </div>
                )}
                </div>
              )}

              {/* Onglet Checklist IA */}
              {dismantlingPanelTab === 'checklist' && (
                <div className="space-y-6">
                  {/* Info du lot pour la checklist */}
                  <div className={`${bg('bg-blue-500/10', 'bg-blue-50')} ${border('border-blue-500/30', 'border-blue-200')} border rounded-xl p-4`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Info className="w-5 h-5 text-blue-600" />
                      <span className={`text-sm font-semibold ${text('text-blue-700', 'text-blue-700')}`}>
                        Lot Sélectionné
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <div className={`text-xs ${subTextClasses}`}>Code Lot</div>
                        <div className={`font-mono font-bold ${headingClasses}`}>{lot.code}</div>
                      </div>
                      <div>
                        <div className={`text-xs ${subTextClasses}`}>Catégorie</div>
                        <div className={`font-medium ${headingClasses}`}>{lot.categorieName}</div>
                      </div>
                      <div>
                        <div className={`text-xs ${subTextClasses}`}>Composants</div>
                        <div className={`font-bold ${headingClasses}`}>{lot.components?.length || 0} éléments</div>
                      </div>
                      <div>
                        <div className={`text-xs ${subTextClasses}`}>Poids Total</div>
                        <div className={`font-bold ${headingClasses}`}>{lot.poidsReel || lot.poidsEstime || 0} kg</div>
                      </div>
                    </div>
                  </div>

                  {/* Checklist Summary */}
                  {generatedChecklist && (
                    <>
                      <div className={`bg-gradient-to-r from-purple-600 via-purple-500 to-cyan-500 rounded-xl p-6 text-white shadow-xl shadow-purple-500/30`}>
                        <div className="mb-4">
                          <h3 className="text-2xl font-bold flex items-center gap-2 mb-2">
                            <Sparkles className="w-6 h-6" />
                            Résumé du Démontage IA
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="bg-white bg-opacity-30 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5">
                              <Package className="w-4 h-4" />
                              {selectedLotForDismantling?.categorieName || 'Catégorie'}
                            </span>
                            {selectedLotForDismantling?.subcategory && (
                              <ChevronRight className="w-4 h-4 opacity-70" />
                            )}
                            {selectedLotForDismantling?.subcategory && (
                              <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                                {selectedLotForDismantling.subcategory}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-white bg-opacity-20 rounded-lg p-4">
                            <Clock className="w-6 h-6 mb-2" />
                            <div className="text-sm opacity-90">Temps Total</div>
                            <div className="text-3xl font-bold">{generatedChecklist.summary.total_time_min} min</div>
                          </div>
                          <div className="bg-white bg-opacity-20 rounded-lg p-4">
                            <Layers className="w-6 h-6 mb-2" />
                            <div className="text-sm opacity-90">Étapes</div>
                            <div className="text-3xl font-bold">{generatedChecklist.summary.total_steps}</div>
                          </div>
                          <div className="bg-white bg-opacity-20 rounded-lg p-4">
                            <Recycle className="w-6 h-6 mb-2" />
                            <div className="text-sm opacity-90">Valorisable</div>
                            <div className="text-3xl font-bold">{generatedChecklist.summary.recyclable_percentage}%</div>
                          </div>
                          <div className="bg-white bg-opacity-20 rounded-lg p-4">
                            <Leaf className="w-6 h-6 mb-2" />
                            <div className="text-sm opacity-90">CO₂ Évité</div>
                            <div className="text-3xl font-bold">{generatedChecklist.summary.total_eco_value_kg_co2} kg</div>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white border-opacity-30">
                          <div className="text-sm opacity-90 mb-2">Filières principales:</div>
                          <div className="flex flex-wrap gap-2">
                            {generatedChecklist.summary.main_streams.map((stream: string, idx: number) => (
                              <span key={idx} className="bg-white bg-opacity-30 px-3 py-1 rounded-full text-sm">
                                {stream}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      {/* Checklist Steps */}
                      <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-xl p-6`}>
                        <h3 className={`text-2xl font-bold ${headingClasses} mb-6`}>Étapes de Démontage</h3>

                        <div className="space-y-4">
                          {generatedChecklist.steps.map((step: any) => (
                            <div key={step.step} className={`border-2 rounded-lg overflow-hidden transition-all ${
                              completedChecklistSteps[step.step] ? `${bg('bg-cyan-500/10', 'bg-cyan-50')} ${border('border-cyan-500/30', 'border-cyan-300')}` : `${bg('bg-slate-800/50', 'bg-white')} ${border('border-slate-700', 'border-gray-200')}`
                            }`}>
                              <div
                                className={`p-4 cursor-pointer ${bg('hover:bg-slate-700/30', 'hover:bg-gray-50')} transition-colors`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  toggleChecklistStep(step.step);
                                }}
                              >
                                <div className="flex items-start gap-4">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      toggleChecklistComplete(step.step);
                                    }}
                                    className="mt-1 flex-shrink-0"
                                  >
                                    {completedChecklistSteps[step.step] ? (
                                      <div className="relative">
                                        <CheckCircle2 className="text-cyan-600" size={24} />
                                        <div className="absolute inset-0 bg-cyan-400/30 rounded-full blur animate-pulse" />
                                      </div>
                                    ) : (
                                      <div className={`w-6 h-6 border-2 ${border('border-slate-600', 'border-gray-300')} rounded-full hover:border-cyan-500 transition-colors`} />
                                    )}
                                  </button>

                                  <div className="flex-1">
                                    <div className="flex items-start justify-between gap-4 mb-2">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                          <span className={`text-lg font-bold ${headingClasses}`}>Étape {step.step}</span>
                                          <span className={`px-2 py-1 rounded text-xs font-semibold border ${getPriorityColor(step.priority)}`}>
                                            {step.priority === 'critical' ? 'CRITIQUE' : step.priority === 'high' ? 'HAUTE' : step.priority === 'medium' ? 'MOYENNE' : 'BASSE'}
                                          </span>
                                        </div>
                                        <p className={`${text('text-slate-200', 'text-gray-800')} font-medium`}>{step.action}</p>
                                      </div>

                                      <div className={`flex items-center gap-2 ${subTextClasses}`}>
                                        <Clock size={16} />
                                        <span className="text-sm font-semibold">{step.estimated_time_min} min</span>
                                      </div>
                                    </div>

                                    {!expandedChecklistSteps[step.step] && (
                                      <div className={`flex items-center gap-2 text-sm ${subTextClasses}`}>
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

                                  {expandedChecklistSteps[step.step] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </div>
                              </div>

                              {expandedChecklistSteps[step.step] && (
                                <div className={`px-4 pb-4 pt-2 ${bg('bg-slate-800/30', 'bg-gray-50')} ${border('border-t-slate-700', 'border-t-gray-200')} border-t`}>
                                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                      <div className={`flex items-center gap-2 text-sm font-semibold ${headingClasses} mb-2`}>
                                        <Wrench size={16} />
                                        Outils Nécessaires
                                      </div>
                                      <ul className={`list-disc list-inside text-sm ${subTextClasses} space-y-1`}>
                                        {step.tools.map((tool: string, idx: number) => (
                                          <li key={idx}>{tool}</li>
                                        ))}
                                      </ul>
                                    </div>

                                    <div>
                                      <div className={`flex items-center gap-2 text-sm font-semibold ${headingClasses} mb-2`}>
                                        <Shield size={16} />
                                        Équipements de Protection
                                      </div>
                                      <ul className={`list-disc list-inside text-sm ${subTextClasses} space-y-1`}>
                                        {step.EPI.map((epi: string, idx: number) => (
                                          <li key={idx}>{epi}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                      <Recycle size={16} className="text-green-600" />
                                      <span className={`font-medium ${headingClasses}`}>Destination:</span>
                                      <span className={`font-semibold ${getStreamColor(step.output_stream)}`}>
                                        {step.output_stream}
                                      </span>
                                    </div>

                                    {step.eco_value > 0 && (
                                      <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-green-500 rounded-full" />
                                        <span className={`font-medium ${headingClasses}`}>Impact:</span>
                                        <span className="font-semibold text-green-600">
                                          {step.eco_value} kg CO₂ évité
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {step.priority === 'critical' && (
                                    <div className={`mt-3 flex items-start gap-2 ${bg('bg-red-500/10', 'bg-red-50')} ${border('border-red-500/30', 'border-red-200')} border rounded p-3`}>
                                      <AlertTriangle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                                      <p className="text-sm text-red-600">
                                        <strong>Attention:</strong> Cette étape est critique pour la sécurité. Suivez scrupuleusement les consignes.
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className={`mt-6 pt-6 ${border('border-t-slate-700', 'border-t-gray-200')} border-t`}>
                          <div className={`text-center ${subTextClasses}`}>
                            <strong>{Object.keys(completedChecklistSteps).filter(k => completedChecklistSteps[Number(k)]).length}</strong> sur <strong>{generatedChecklist.steps.length}</strong> étapes complétées
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  };

  const SynthesisTab = () => {
    const [isRulesOpen, setIsRulesOpen] = useState(false);

    if (!selectedCaseFileDetails) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className={`text-xs ${subTextClasses}`}>Sélectionnez un dossier pour voir les détails</div>
        </div>
      );
    }

    const details = selectedCaseFileDetails;
    const poidsReel = details.poidsReel || 0;
    const poidsEstime = details.poidsEstime || 0;
    const poidsDisplay = poidsReel > 0 ? (poidsReel / 1000).toFixed(2) : (poidsEstime / 1000).toFixed(2);
    const poidsVariation = poidsEstime > 0 && poidsReel > 0
      ? (((poidsReel - poidsEstime) / poidsEstime) * 100).toFixed(1)
      : '0';

    const nombreLots = details.lots?.length || 0;
    const valeurTotale = details.valeurTotale || 0;
    const lotsData = details.lots || [];

    const quotation = details.quotations && details.quotations.length > 0 ? details.quotations[0] : null;
    const devisStatut = quotation?.statut || 'pending';
    const devisDate = quotation?.createdAt ? new Date(quotation.createdAt).toLocaleDateString('fr-FR') : '-';

    return (
    <div className="space-y-4 overflow-hidden h-[calc(100vh-180px)]">
      {/* Header avec bouton Modifier */}
      <div className="flex items-center justify-end gap-3 pb-2">
        <button
          onClick={() => {
            setIsEditMode(true);
            setIsRequestPanelOpen(true);
          }}
          className={`flex items-center gap-2 px-4 py-2 ${bg('bg-blue-500 hover:bg-blue-600', 'bg-blue-500 hover:bg-blue-600')} text-white rounded-lg transition-all duration-200 text-sm font-medium shadow-sm`}
          title="Modifier la demande"
        >
          <FileEdit className="w-4 h-4" />
          Modifier
        </button>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Catégorie - PREMIÈRE CARD */}
        <div className={`${bg('bg-slate-900', 'bg-gray-50')} ${border('border-slate-800', 'border-gray-200')} border rounded-xl p-4 transition-all duration-300`}>
          <div className="flex items-center justify-between mb-2">
            <div className={`text-xs ${subTextClasses}`}>Catégorie</div>
            {(() => {
              const categorie = details.request?.categoriePrincipale?.toLowerCase() || 'autre';
              const IconComponent =
                categorie.includes('informatique') ? Monitor :
                categorie.includes('électroménager') || categorie.includes('electromenager') ? Home :
                categorie.includes('mobilier') || categorie.includes('meuble') ? Package :
                categorie.includes('équipement') || categorie.includes('equipement') ? Settings :
                Layers;
              return <IconComponent className="w-4 h-4 text-cyan-600" />;
            })()}
          </div>
          <div className={`text-xl font-bold ${text('text-slate-100', 'text-gray-900')}`}>
            {(() => {
              const categorie = details.request?.categoriePrincipale || 'Non définie';
              return categorie.charAt(0).toUpperCase() + categorie.slice(1);
            })()}
          </div>
          <div className={`text-xs ${mutedTextClasses} mt-1`}>
            {nombreLots} lot{nombreLots > 1 ? 's' : ''} concerné{nombreLots > 1 ? 's' : ''}
          </div>
        </div>

        <div className={`${bg('bg-slate-900', 'bg-gray-50')} ${border('border-slate-800', 'border-gray-200')} border rounded-xl p-4 transition-all duration-300`}>
          <div className="flex items-center justify-between mb-2">
            <div className={`text-xs ${subTextClasses}`}>Poids Total</div>
            <Weight className="w-4 h-4 text-cyan-600" />
          </div>
          <div className={`text-2xl font-bold ${text('text-slate-100', 'text-gray-900')}`}>{poidsDisplay} T</div>
          <div className={`text-xs mt-1 ${parseFloat(poidsVariation) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {parseFloat(poidsVariation) >= 0 ? '+' : ''}{poidsVariation}% vs estimé
          </div>
        </div>

        <div className={`${bg('bg-slate-900', 'bg-gray-50')} ${border('border-slate-800', 'border-gray-200')} border rounded-xl p-4 transition-all duration-300`}>
          <div className="flex items-center justify-between mb-2">
            <div className={`text-xs ${subTextClasses}`}>Nombre de Lots</div>
            <Package className="w-4 h-4 text-cyan-600" />
          </div>
          <div className={`text-2xl font-bold ${text('text-slate-100', 'text-gray-900')}`}>{nombreLots}</div>
          <div className={`text-xs ${mutedTextClasses} mt-1`}>
            {nombreLots > 0 ? 'Diagnostiqués' : 'Diagnostic à faire'}
          </div>
        </div>

        <div className={`${bg('bg-slate-900', 'bg-gray-50')} ${border('border-slate-800', 'border-gray-200')} border rounded-xl p-4 transition-all duration-300`}>
          <div className="flex items-center justify-between mb-2">
            <div className={`text-xs ${subTextClasses}`}>Valeur Estimée</div>
            <Euro className="w-4 h-4 text-cyan-600" />
          </div>
          <div className={`text-2xl font-bold ${text('text-slate-100', 'text-gray-900')}`}>{valeurTotale.toLocaleString()} €</div>
          <div className={`text-xs ${mutedTextClasses} mt-1`}>Hors services</div>
        </div>

        <div className={`${bg('bg-slate-900', 'bg-gray-50')} ${border('border-slate-800', 'border-gray-200')} border rounded-xl p-4 transition-all duration-300`}>
          <div className="flex items-center justify-between mb-2">
            <div className={`text-xs ${subTextClasses}`}>Statut Devis</div>
            <FileSpreadsheet className="w-4 h-4 text-cyan-600" />
          </div>
          <div className={`text-xl font-bold ${
            devisStatut === 'approved' ? 'text-emerald-600' :
            devisStatut === 'sent' ? 'text-cyan-600' :
            subTextClasses
          }`}>
            {devisStatut === 'approved' ? 'Approuvé' :
             devisStatut === 'sent' ? 'Envoyé' :
             'En attente'}
          </div>
          <div className={`text-xs ${mutedTextClasses} mt-1`}>Le {devisDate}</div>
        </div>
      </div>

      {/* Grid 2 colonnes pour Comparaison Financière et Estimation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Graphique Valeur Estimée vs Revente */}
        <div className={`${bg('bg-slate-900', 'bg-gray-50')} ${border('border-slate-800', 'border-gray-200')} border rounded-xl p-6`}>
        <h3 className={`text-sm font-semibold ${text('text-slate-200', 'text-gray-800')} mb-4 flex items-center`}>
          <TrendingUp className="w-4 h-4 mr-2 text-cyan-600" />
          Comparaison Financière
        </h3>

        <div className="space-y-4">
          {/* Valeur Totale Calculée (somme des lots) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Euro className="w-4 h-4 text-emerald-600" />
                <span className={`text-sm ${text('text-slate-300', 'text-gray-700')}`}>Valeur Totale (Lots)</span>
              </div>
              <span className={`text-lg font-bold ${text('text-slate-100', 'text-gray-900')}`}>
                {valeurTotale.toLocaleString()} €
              </span>
            </div>
            <div className="relative h-3 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(226, 232, 240, 1)' }}>
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, (valeurTotale / Math.max(valeurTotale || 1, details.request?.valeurEstimee || 1, details.request?.valeurRevente || 1)) * 100)}%`,
                  background: 'rgba(59, 130, 246, 0.8)',
                  boxShadow: isDark ? '0 0 10px rgba(59, 130, 246, 0.8)' : '0 0 5px rgba(59, 130, 246, 0.8)',
                }}
              />
            </div>
          </div>

          {/* Valeur Estimée Initiale */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className={`text-sm ${text('text-slate-300', 'text-gray-700')}`}>Valeur Estimée (Demande)</span>
              </div>
              <span className={`text-lg font-bold ${text('text-slate-100', 'text-gray-900')}`}>
                {(details.request?.valeurEstimee || 0).toLocaleString()} €
              </span>
            </div>
            <div className="relative h-3 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(226, 232, 240, 1)' }}>
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, ((details.request?.valeurEstimee || 0) / Math.max(valeurTotale || 1, details.request?.valeurEstimee || 1, details.request?.valeurRevente || 1)) * 100)}%`,
                  background: 'rgba(99, 102, 241, 0.8)',
                  boxShadow: isDark ? '0 0 10px rgba(99, 102, 241, 0.8)' : '0 0 5px rgba(99, 102, 241, 0.8)',
                }}
              />
            </div>
          </div>

          {/* Valeur Revente */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-600" />
                <span className={`text-sm ${text('text-slate-300', 'text-gray-700')}`}>Valeur Revente</span>
              </div>
              <span className={`text-lg font-bold ${text('text-slate-100', 'text-gray-900')}`}>
                {(details.request?.valeurRevente || 0).toLocaleString()} €
              </span>
            </div>
            <div className="relative h-3 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(226, 232, 240, 1)' }}>
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, ((details.request?.valeurRevente || 0) / Math.max(valeurTotale || 1, details.request?.valeurEstimee || 1, details.request?.valeurRevente || 1)) * 100)}%`,
                  background: 'rgba(139, 92, 246, 0.8)',
                  boxShadow: isDark ? '0 0 10px rgba(139, 92, 246, 0.8)' : '0 0 5px rgba(139, 92, 246, 0.8)',
                }}
              />
            </div>
          </div>

          {/* Écart entre Valeur Totale et Estimée */}
          <div className={`mt-4 p-3 ${bg('bg-slate-800', 'bg-gray-100')} rounded-lg`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs ${text('text-slate-400', 'text-gray-600')}`}>Écart Totale vs Estimée</span>
              <span className={`text-sm font-semibold ${
                valeurTotale > (details.request?.valeurEstimee || 0)
                  ? 'text-emerald-600'
                  : 'text-red-600'
              }`}>
                {valeurTotale > (details.request?.valeurEstimee || 0) ? '+' : ''}
                {(valeurTotale - (details.request?.valeurEstimee || 0)).toLocaleString()} €
              </span>
            </div>
            <div className={`text-xs ${text('text-slate-500', 'text-gray-500')} mt-1`}>
              {valeurTotale > (details.request?.valeurEstimee || 0)
                ? 'Gain sur l\'estimation'
                : 'Perte sur l\'estimation'}
            </div>
          </div>
        </div>
        </div>

        {/* Estimation de valeur & filière optimale */}
        <div className={`${bg('bg-slate-900', 'bg-gray-50')} ${border('border-slate-800', 'border-gray-200')} border rounded-xl p-6`}>
        <h3 className={`text-sm font-semibold ${text('text-slate-100', 'text-gray-900')} mb-6 flex items-center`}>
          <TrendingUp className="w-4 h-4 mr-2 text-cyan-600" />
          Estimation de Valeur & Filière Optimale
        </h3>
        {(() => {
          // Calcul du score éco-économique basé sur les lots
          const lotsData = details.lots || [];

          // Coefficients par filière et grade
          const coefficients = {
            reemploi: { A: 1.0, B: 0.8, C: 0.5, D: 0.2 },
            recyclage: { A: 0.6, B: 0.7, C: 0.8, D: 0.6 },
            traitement: { A: 0.3, B: 0.4, C: 0.5, D: 0.9 }
          };

          // Valeurs moyennes par kg selon la filière
          const valeurParKg = {
            reemploi: 15, // €/kg pour réemploi
            recyclage: 3, // €/kg pour recyclage matière
            traitement: -2 // €/kg coût de traitement (négatif)
          };

          // CO2 évité par kg selon la filière (kg CO2/kg matière)
          const co2ParKg = {
            reemploi: 8.5, // Fort impact positif
            recyclage: 4.2, // Impact moyen
            traitement: -1.5 // Impact négatif (incinération)
          };

          let totalPoids = 0;
          let scoreReemploi = 0;
          let scoreRecyclage = 0;
          let scoreTraitement = 0;

          // Calcul des scores pour chaque lot
          lotsData.forEach((lot: any) => {
            const poids = (lot.poidsReel || lot.poidsEstime || 0) / 1000; // Conversion en kg
            const grade = lot.grade || 'C';

            totalPoids += poids;

            // Score pondéré par le poids et le grade
            scoreReemploi += poids * (coefficients.reemploi[grade as keyof typeof coefficients.reemploi] || 0.5);
            scoreRecyclage += poids * (coefficients.recyclage[grade as keyof typeof coefficients.recyclage] || 0.7);
            scoreTraitement += poids * (coefficients.traitement[grade as keyof typeof coefficients.traitement] || 0.5);
          });

          // Normalisation des scores sur 100
          const maxScore = Math.max(scoreReemploi, scoreRecyclage, scoreTraitement) || 1;
          const scoreReemploiNorm = Math.round((scoreReemploi / maxScore) * 100);
          const scoreRecyclageNorm = Math.round((scoreRecyclage / maxScore) * 100);
          const scoreTraitementNorm = Math.round((scoreTraitement / maxScore) * 100);

          // Détermination de la filière recommandée
          const recommandation =
            scoreReemploiNorm >= scoreRecyclageNorm && scoreReemploiNorm >= scoreTraitementNorm ? 'reemploi' :
            scoreRecyclageNorm >= scoreTraitementNorm ? 'recyclage' : 'traitement';

          const scoreRecommande =
            recommandation === 'reemploi' ? scoreReemploiNorm :
            recommandation === 'recyclage' ? scoreRecyclageNorm : scoreTraitementNorm;

          // Calcul de la valeur estimée et CO2 évité
          const valeurEstimee = Math.round(totalPoids * valeurParKg[recommandation]);
          const co2Evite = Math.round(totalPoids * co2ParKg[recommandation] * 10) / 10;

          // Couleurs selon la recommandation
          const couleurRecommandation = {
            reemploi: { text: 'text-emerald-600', bg: 'bg-emerald-500', border: 'border-emerald-400', shadow: 'shadow-emerald-500' },
            recyclage: { text: 'text-cyan-600', bg: 'bg-cyan-500', border: 'border-cyan-400', shadow: 'shadow-cyan-500' },
            traitement: { text: 'text-orange-600', bg: 'bg-orange-500', border: 'border-orange-400', shadow: 'shadow-orange-500' }
          };

          const couleurs = couleurRecommandation[recommandation];

          return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Jauge principale - Recommandation */}
              <div className="lg:col-span-2">
                {/* Comparaison des 3 filières */}
                <div className="space-y-4">
                    {/* Réemploi */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Recycle className="w-4 h-4 text-emerald-600" />
                          <span className={`text-sm ${text('text-slate-300', 'text-gray-700')}`}>Réemploi</span>
                        </div>
                        <span className={`text-lg font-bold ${text('text-slate-100', 'text-gray-900')}`}>
                          {scoreReemploiNorm}
                        </span>
                      </div>
                      <div className="relative h-3 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(226, 232, 240, 1)' }}>
                        <div
                          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                          style={{
                            width: `${scoreReemploiNorm}%`,
                            background: 'rgba(59, 130, 246, 0.8)',
                            boxShadow: isDark ? '0 0 10px rgba(59, 130, 246, 0.8)' : '0 0 5px rgba(59, 130, 246, 0.8)',
                          }}
                        />
                      </div>
                    </div>

                    {/* Recyclage */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-cyan-600" />
                          <span className={`text-sm ${text('text-slate-300', 'text-gray-700')}`}>Recyclage</span>
                        </div>
                        <span className={`text-lg font-bold ${text('text-slate-100', 'text-gray-900')}`}>
                          {scoreRecyclageNorm}
                        </span>
                      </div>
                      <div className="relative h-3 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(226, 232, 240, 1)' }}>
                        <div
                          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                          style={{
                            width: `${scoreRecyclageNorm}%`,
                            background: 'rgba(99, 102, 241, 0.8)',
                            boxShadow: isDark ? '0 0 10px rgba(99, 102, 241, 0.8)' : '0 0 5px rgba(99, 102, 241, 0.8)',
                          }}
                        />
                      </div>
                    </div>

                    {/* Traitement */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Trash2 className="w-4 h-4 text-orange-600" />
                          <span className={`text-sm ${text('text-slate-300', 'text-gray-700')}`}>Traitement</span>
                        </div>
                        <span className={`text-lg font-bold ${text('text-slate-100', 'text-gray-900')}`}>
                          {scoreTraitementNorm}
                        </span>
                      </div>
                      <div className="relative h-3 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(226, 232, 240, 1)' }}>
                        <div
                          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                          style={{
                            width: `${scoreTraitementNorm}%`,
                            background: 'rgba(139, 92, 246, 0.8)',
                            boxShadow: isDark ? '0 0 10px rgba(139, 92, 246, 0.8)' : '0 0 5px rgba(139, 92, 246, 0.8)',
                          }}
                        />
                      </div>
                    </div>
                  </div>
              </div>

              {/* Indicateurs financiers et environnementaux */}
              <div className="space-y-4">
                {/* Valeur estimée */}
                <div className={`${bg('bg-slate-800', 'bg-gray-100')} ${border('border-slate-700', 'border-gray-300')} border rounded-xl p-4`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Euro className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className={`text-xs ${subTextClasses}`}>Valeur Estimée</div>
                      <div className={`text-2xl font-bold ${valeurEstimee >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {valeurEstimee >= 0 ? '+' : ''}{valeurEstimee.toLocaleString()} €
                      </div>
                    </div>
                  </div>
                  <div className={`text-xs ${mutedTextClasses}`}>
                    Basé sur {totalPoids.toFixed(1)} kg de matériel
                  </div>
                </div>

                {/* CO2 évité */}
                <div className={`${bg('bg-slate-800', 'bg-gray-100')} ${border('border-slate-700', 'border-gray-300')} border rounded-xl p-4`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Leaf className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className={`text-xs ${subTextClasses}`}>CO₂ Évité</div>
                      <div className={`text-2xl font-bold ${co2Evite >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {co2Evite >= 0 ? '+' : ''}{co2Evite} kg
                      </div>
                    </div>
                  </div>
                  <div className={`text-xs ${mutedTextClasses}`}>
                    Impact environnemental positif
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Règles de calcul visibles - avec animation */}
        <div className="mt-6">
          <button
            onClick={() => setIsRulesOpen(!isRulesOpen)}
            className={`w-full cursor-pointer text-sm font-medium ${subTextClasses} hover:${text('text-slate-300', 'text-gray-700')} transition-colors flex items-center gap-2`}
          >
            <Info className="w-4 h-4" />
            <span>Voir les règles de calcul et coefficients</span>
            <ChevronDown
              className={`w-4 h-4 ml-auto transition-transform duration-300 ${
                isRulesOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
          <div
            className={`overflow-hidden transition-all duration-500 ease-in-out ${
              isRulesOpen ? 'max-h-[800px] opacity-100 mt-4' : 'max-h-0 opacity-0'
            }`}
          >
            <div className={`p-4 ${bg('bg-slate-800', 'bg-gray-100')} ${border('border-slate-700', 'border-gray-300')} border rounded-lg`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <h5 className={`font-semibold ${text('text-slate-200', 'text-gray-800')} mb-2`}>Coefficients par Grade</h5>
                <table className="w-full">
                  <thead>
                    <tr className={subTextClasses}>
                      <th className="text-left py-1">Grade</th>
                      <th className="text-center py-1">Réemploi</th>
                      <th className="text-center py-1">Recyclage</th>
                      <th className="text-center py-1">Traitement</th>
                    </tr>
                  </thead>
                  <tbody className={text('text-slate-300', 'text-gray-700')}>
                    <tr>
                      <td className="py-1">A (Excellent)</td>
                      <td className="text-center text-emerald-600 font-semibold">1.0</td>
                      <td className="text-center">0.6</td>
                      <td className="text-center">0.3</td>
                    </tr>
                    <tr>
                      <td className="py-1">B (Bon)</td>
                      <td className="text-center text-emerald-600 font-semibold">0.8</td>
                      <td className="text-center">0.7</td>
                      <td className="text-center">0.4</td>
                    </tr>
                    <tr>
                      <td className="py-1">C (Moyen)</td>
                      <td className="text-center">0.5</td>
                      <td className="text-center text-cyan-600 font-semibold">0.8</td>
                      <td className="text-center">0.5</td>
                    </tr>
                    <tr>
                      <td className="py-1">D (Mauvais)</td>
                      <td className="text-center">0.2</td>
                      <td className="text-center">0.6</td>
                      <td className="text-center text-orange-600 font-semibold">0.9</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div>
                <h5 className={`font-semibold ${text('text-slate-200', 'text-gray-800')} mb-2`}>Valeur par kg</h5>
                <ul className={`space-y-1 ${text('text-slate-300', 'text-gray-700')}`}>
                  <li className="flex justify-between">
                    <span>Réemploi:</span>
                    <span className="font-semibold text-emerald-600">+15 €/kg</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Recyclage:</span>
                    <span className="font-semibold text-cyan-600">+3 €/kg</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Traitement:</span>
                    <span className="font-semibold text-orange-600">-2 €/kg</span>
                  </li>
                </ul>
              </div>
              <div>
                <h5 className={`font-semibold ${text('text-slate-200', 'text-gray-800')} mb-2`}>Impact CO₂ par kg</h5>
                <ul className={`space-y-1 ${text('text-slate-300', 'text-gray-700')}`}>
                  <li className="flex justify-between">
                    <span>Réemploi:</span>
                    <span className="font-semibold text-green-600">+8.5 kg CO₂</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Recyclage:</span>
                    <span className="font-semibold text-green-600">+4.2 kg CO₂</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Traitement:</span>
                    <span className="font-semibold text-red-600">-1.5 kg CO₂</span>
                  </li>
                </ul>
              </div>
            </div>
            <p className={`mt-3 text-xs ${subTextClasses} italic`}>
              * Le score est calculé en pondérant chaque lot par son poids et son grade, puis normalisé sur 100.
              La filière recommandée est celle qui obtient le meilleur score éco-économique.
            </p>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Main Content: 12-column grid layout - NO SCROLLBAR */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4 h-[calc(100%-250px)]">
        {/* Calendar - 3/12 sur 27" (1/4), 1/2 sur iPad */}
        <div className="md:col-span-1 xl:col-span-3">
        <div className={`${bg('bg-slate-900', 'bg-gray-50')} ${border('border-slate-800', 'border-gray-200')} border rounded-xl p-4 h-full flex flex-col`}>
          <h3 className={`text-sm font-semibold ${text('text-slate-200', 'text-gray-800')} mb-3 flex items-center flex-shrink-0`}>
            <Calendar className="w-4 h-4 mr-2 text-cyan-600" />
            Calendrier
          </h3>
          <div className="flex-1 overflow-y-auto pr-1">
          {(() => {
            // Collecter tous les événements du dossier avec leurs couleurs
            const events: Array<{ date: Date; label: string; color: string; icon: any }> = [];

            // 1. Demande (toujours présent)
            if (details.createdAt) {
              events.push({
                date: new Date(details.createdAt),
                label: 'Demande',
                color: 'emerald',
                icon: FileText
              });
            }

            // 2. Diagnostic
            if (details.diagnosis?.dateVisite) {
              events.push({
                date: new Date(details.diagnosis.dateVisite),
                label: 'Diagnostic',
                color: 'blue',
                icon: Clipboard
              });
            } else if (details.request?.plannedVisitAt) {
              events.push({
                date: new Date(details.request.plannedVisitAt),
                label: 'Visite prévue',
                color: 'cyan',
                icon: Clipboard
              });
            }

            // 3. Devis
            if (quotation?.createdAt) {
              events.push({
                date: new Date(quotation.createdAt),
                label: 'Devis',
                color: quotation.statut === 'approved' ? 'emerald' : 'yellow',
                icon: FileSpreadsheet
              });
            }

            // 4. Collecte
            if (details.request?.plannedVisitAt && details.statut !== 'diagnostic_pending') {
              events.push({
                date: new Date(details.request.plannedVisitAt),
                label: 'Collecte',
                color: 'orange',
                icon: Truck
              });
            }

            // 5. Clôture
            if (details.closedAt) {
              events.push({
                date: new Date(details.closedAt),
                label: 'Clôturé',
                color: 'emerald',
                icon: CheckCircle2
              });
            }

            // Déterminer le mois à afficher (mois de la date de création)
            const displayDate = details.createdAt ? new Date(details.createdAt) : new Date();
            const currentMonth = displayDate.getMonth();
            const currentYear = displayDate.getFullYear();

            // Calculer les jours du mois
            const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
            const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
            const daysInMonth = lastDayOfMonth.getDate();
            const firstDayWeekday = firstDayOfMonth.getDay(); // 0 = dimanche

            // Ajuster pour que lundi soit le premier jour (0 = lundi)
            const startOffset = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1;

            // Créer un mapping des événements par jour
            const eventsByDay: { [day: number]: Array<{ label: string; color: string; icon: any }> } = {};
            events.forEach(event => {
              if (event.date.getMonth() === currentMonth && event.date.getFullYear() === currentYear) {
                const day = event.date.getDate();
                if (!eventsByDay[day]) {
                  eventsByDay[day] = [];
                }
                eventsByDay[day].push(event);
              }
            });

            // Noms des jours de la semaine
            const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

            // Nom du mois
            const monthNames = [
              'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
              'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
            ];

            // Fonction pour obtenir la classe de couleur
            const getColorClasses = (color: string) => {
              switch (color) {
                case 'emerald':
                  return {
                    bg: 'bg-emerald-500',
                    ring: 'ring-emerald-400',
                    text: 'text-emerald-600'
                  };
                case 'blue':
                  return {
                    bg: 'bg-blue-500',
                    ring: 'ring-blue-400',
                    text: 'text-blue-600'
                  };
                case 'cyan':
                  return {
                    bg: 'bg-cyan-500',
                    ring: 'ring-cyan-400',
                    text: 'text-cyan-600'
                  };
                case 'yellow':
                  return {
                    bg: 'bg-yellow-500',
                    ring: 'ring-yellow-400',
                    text: 'text-yellow-600'
                  };
                case 'orange':
                  return {
                    bg: 'bg-orange-500',
                    ring: 'ring-orange-400',
                    text: 'text-orange-600'
                  };
                default:
                  return {
                    bg: 'bg-slate-500',
                    ring: 'ring-slate-400',
                    text: 'text-slate-400'
                  };
              }
            };

            return (
              <div>
                {/* En-tête du calendrier */}
                <div className={`text-center mb-3 ${text('text-slate-200', 'text-gray-800')} font-semibold text-xs`}>
                  {monthNames[currentMonth]} {currentYear}
                </div>

                {/* Grille du calendrier compacte */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Jours de la semaine */}
                  {weekDays.map((day, index) => (
                    <div key={`weekday-${index}`} className={`text-center text-[10px] font-semibold ${subTextClasses} py-1`}>
                      {day}
                    </div>
                  ))}

                  {/* Jours vides avant le premier jour du mois */}
                  {Array.from({ length: startOffset }).map((_, index) => (
                    <div key={`empty-${index}`} className="aspect-square"></div>
                  ))}

                  {/* Jours du mois */}
                  {Array.from({ length: daysInMonth }).map((_, index) => {
                    const day = index + 1;
                    const dayEvents = eventsByDay[day] || [];
                    const hasEvents = dayEvents.length > 0;

                    return (
                      <div
                        key={`day-${day}`}
                        className={`aspect-square flex flex-col items-center justify-center rounded border transition-all ${
                          hasEvents
                            ? 'border-cyan-500/50 bg-cyan-500/10'
                            : `${border('border-slate-700', 'border-gray-300')} ${bg('bg-slate-800/30', 'bg-gray-100')}`
                        }`}
                      >
                        <div className={`text-[10px] ${hasEvents ? 'font-bold text-cyan-700' : text('text-slate-300', 'text-gray-700')}`}>
                          {day}
                        </div>
                        {hasEvents && dayEvents.length > 0 && (
                          <div className="flex gap-[2px] mt-[2px]">
                            {dayEvents.slice(0, 2).map((event, eventIndex) => {
                              const colorClasses = getColorClasses(event.color);
                              return (
                                <div
                                  key={`event-${day}-${eventIndex}`}
                                  className={`w-1 h-1 rounded-full ${colorClasses.bg}`}
                                  title={event.label}
                                ></div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
          </div>
        </div>
        </div>

        {/* Timeline - 3/12 sur 27" (1/4), 1/2 sur iPad */}
        <div className="md:col-span-1 xl:col-span-3">
        <div className={`${bg('bg-slate-900', 'bg-gray-50')} ${border('border-slate-800', 'border-gray-200')} border rounded-xl p-4 h-full flex flex-col`}>
          <h3 className={`text-sm font-semibold ${text('text-slate-200', 'text-gray-800')} mb-3 flex items-center flex-shrink-0`}>
            <Clock className="w-4 h-4 mr-2 text-cyan-600" />
            Timeline
          </h3>
          <div className="flex-1 overflow-y-auto pr-1">
            <div className="relative pl-6">
          {(() => {
            const formatDate = (date: string) => new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const statut = details.statut;
            const hasDiagnosis = details.diagnosis !== null && details.diagnosis !== undefined;
            const hasQuotation = quotation !== null;
            const quotationApproved = quotation?.statut === 'approved';
            const isClosed = details.closedAt !== null;

            // Déterminer quelle étape est en cours selon une logique séquentielle stricte
            let currentStep = 1; // Par défaut, on est sur la demande (qui est toujours complétée)

            // Déterminer l'étape actuelle
            if (!hasDiagnosis) {
              currentStep = 2; // Diagnostic en attente
            } else if (!quotationApproved) {
              currentStep = 3; // Devis en attente ou en cours
            } else if (statut === 'in_collection') {
              currentStep = 4; // Collecte en cours
            } else if (statut === 'in_progress') {
              currentStep = 5; // Réception en cours
            } else if (statut === 'completed' && !isClosed) {
              currentStep = 6; // Clôture en attente
            } else if (isClosed) {
              currentStep = 7; // Tout est terminé
            }

            // Construire la timeline avec une logique cohérente
            const timeline = [
              // 1. Demande - toujours complétée
              {
                label: 'Demande',
                date: formatDate(details.createdAt),
                status: 'completed',
                icon: FileText
              },
              // 2. Diagnostic
              {
                label: 'Diagnostic',
                date: hasDiagnosis
                  ? formatDate(details.diagnosis.dateVisite)
                  : (details.request?.plannedVisitAt ? formatDate(details.request.plannedVisitAt) : 'À planifier'),
                status: hasDiagnosis ? 'completed' : (currentStep === 2 ? 'in_progress' : 'pending'),
                icon: Clipboard
              },
              // 3. Devis
              {
                label: 'Devis',
                date: hasQuotation ? formatDate(quotation.createdAt) : 'En attente',
                status: quotationApproved ? 'completed' : (currentStep === 3 ? 'in_progress' : (currentStep > 3 ? 'completed' : 'pending')),
                icon: FileSpreadsheet
              },
              // 4. Collecte
              {
                label: 'Collecte',
                date: details.request?.plannedVisitAt ? formatDate(details.request.plannedVisitAt) : 'À planifier',
                status: currentStep > 4 ? 'completed' : (currentStep === 4 ? 'in_progress' : 'pending'),
                icon: Truck
              },
              // 5. Réception
              {
                label: 'Réception',
                date: statut === 'completed' ? formatDate(details.updatedAt) : 'En cours',
                status: currentStep > 5 ? 'completed' : (currentStep === 5 ? 'in_progress' : 'pending'),
                icon: Package
              },
              // 6. Clôture
              {
                label: 'Clôture',
                date: isClosed ? formatDate(details.closedAt) : 'À venir',
                status: isClosed ? 'completed' : (currentStep === 6 ? 'in_progress' : 'pending'),
                icon: CheckCircle2
              }
            ];

            return (
              <div className="relative">
                {/* Vertical line */}
                <div className={`absolute left-0 top-0 bottom-0 w-[2px] ${bg('bg-slate-700', 'bg-gray-300')}`}></div>

                {/* Timeline steps - vertical layout */}
                <div className="space-y-8">
                  {timeline.map((step, index) => {
                    const previousStepCompleted = index > 0 && timeline[index - 1].status === 'completed';
                    const showColoredLine = previousStepCompleted && (step.status === 'completed' || step.status === 'in_progress');

                    return (
                    <div key={index} className="relative group">
                      {/* Colored line segment - only if previous step completed */}
                      {index > 0 && showColoredLine && (
                        <div
                          className={`absolute left-0 w-[2px] transition-all duration-500 ${
                            step.status === 'completed'
                              ? 'bg-emerald-500'
                              : 'bg-cyan-500'
                          }`}
                          style={{
                            top: '-2rem',
                            height: '2rem'
                          }}
                        ></div>
                      )}

                      {/* Step node */}
                      <div className="flex items-start">
                        {/* Circle indicator */}
                        <div className="relative -left-[17px] z-10">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center border-3 transition-all duration-300 ${
                              step.status === 'completed'
                                ? 'bg-emerald-500 border-emerald-400'
                                : step.status === 'in_progress'
                                ? 'bg-cyan-500 border-cyan-400 animate-pulse'
                                : `${bg('bg-slate-800', 'bg-gray-200')} ${border('border-slate-600', 'border-gray-400')}`
                            }`}
                          >
                            <step.icon
                              className={`w-5 h-5 ${
                                step.status === 'completed'
                                  ? 'text-white'
                                  : step.status === 'in_progress'
                                  ? 'text-white'
                                  : mutedTextClasses
                              }`}
                            />
                          </div>
                        </div>

                        {/* Step content */}
                        <div className="ml-6 flex-1 pb-2">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className={`text-sm font-semibold ${
                              step.status === 'completed' || step.status === 'in_progress'
                                ? text('text-slate-200', 'text-gray-800')
                                : subTextClasses
                            }`}>
                              {step.label}
                            </h4>
                            {step.status === 'completed' && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            )}
                            {step.status === 'in_progress' && (
                              <div className="flex items-center">
                                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping mr-2"></div>
                                <span className="text-xs text-cyan-600 font-medium">En cours</span>
                              </div>
                            )}
                          </div>
                          <div className={`text-xs ${subTextClasses}`}>
                            {step.date}
                          </div>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Intervenants - 2/12 sur 27", full width below on iPad */}
        <div className="md:col-span-2 xl:col-span-2">
        <div className={`${bg('bg-slate-900', 'bg-gray-50')} ${border('border-slate-800', 'border-gray-200')} border rounded-xl p-4 h-full flex flex-col`}>
          <h3 className={`text-sm font-semibold ${text('text-slate-200', 'text-gray-800')} mb-3 flex items-center flex-shrink-0`}>
            <Users className="w-4 h-4 mr-2 text-cyan-600" />
            Intervenants
          </h3>
          <div className="flex-1 overflow-y-auto pr-1">
          {isLoadingHrPersonnel ? (
            <div className="flex items-center justify-center py-8">
              <div className={`text-xs ${subTextClasses}`}>Chargement...</div>
            </div>
          ) : hrPersonnel.length > 0 ? (
            <div className="space-y-3 overflow-y-auto flex-1 pr-2">
              {hrPersonnel.map((user) => {
                // Fonction pour obtenir l'icône et la couleur selon le rôle
                const getRoleInfo = (role: string) => {
                  switch (role.toLowerCase()) {
                    case 'admin':
                      return {
                        icon: Settings,
                        color: 'text-red-600',
                        bgColor: 'bg-red-500/10',
                        borderColor: 'border-red-500/30',
                        label: 'Direction'
                      };
                    case 'planificateur':
                      return {
                        icon: Calendar,
                        color: 'text-cyan-600',
                        bgColor: 'bg-cyan-500/10',
                        borderColor: 'border-cyan-500/30',
                        label: 'Planification'
                      };
                    case 'technicien':
                      return {
                        icon: FileEdit,
                        color: 'text-emerald-600',
                        bgColor: 'bg-emerald-500/10',
                        borderColor: 'border-emerald-500/30',
                        label: 'Manutention'
                      };
                    case 'logisticien':
                      return {
                        icon: Truck,
                        color: 'text-orange-600',
                        bgColor: 'bg-orange-500/10',
                        borderColor: 'border-orange-500/30',
                        label: 'Transport'
                      };
                    default:
                      return {
                        icon: Users,
                        color: 'text-slate-400',
                        bgColor: 'bg-slate-500/10',
                        borderColor: 'border-slate-500/30',
                        label: 'Autre'
                      };
                  }
                };

                const roleInfo = getRoleInfo(user.role);
                const RoleIcon = roleInfo.icon;

                // Créer les initiales pour l'avatar
                const initials = user.nom
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <div
                    key={user.id}
                    className={`flex items-center p-3 ${roleInfo.bgColor} border ${roleInfo.borderColor} rounded-lg transition-all duration-300`}
                  >
                    {/* Avatar avec initiales */}
                    <div className={`w-10 h-10 rounded-full ${bg('bg-slate-700', 'bg-gray-300')} flex items-center justify-center mr-3 flex-shrink-0`}>
                      <span className={`text-xs font-semibold ${roleInfo.color}`}>
                        {initials}
                      </span>
                    </div>

                    {/* Info utilisateur */}
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${text('text-slate-200', 'text-gray-800')} truncate`}>
                        {user.nom}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <RoleIcon className={`w-3 h-3 ${roleInfo.color}`} />
                        <span className={`text-xs ${subTextClasses}`}>
                          {roleInfo.label}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className={`w-8 h-8 mx-auto mb-2 ${mutedTextClasses} opacity-20`} />
              <p className={`text-xs ${subTextClasses}`}>Aucun intervenant</p>
            </div>
          )}
          </div>
        </div>
        </div>

        {/* Prochaines Actions - 2/12 sur 27", full width below on iPad */}
        <div className="md:col-span-2 xl:col-span-2">
        <div className={`${bg('bg-slate-900', 'bg-gray-50')} ${border('border-slate-800', 'border-gray-200')} border rounded-xl p-4 h-full flex flex-col`}>
            <h3 className={`text-sm font-semibold ${text('text-slate-200', 'text-gray-800')} mb-3 flex items-center flex-shrink-0`}>
              <AlertCircle className="w-4 h-4 mr-2 text-cyan-600" />
              Actions
            </h3>
            <div className="flex-1 overflow-y-auto pr-1 space-y-2">
            {(() => {
              const statut = details.statut;
              const hasDiagnosis = details.diagnosis !== null;
              const hasQuotation = quotation !== null;
              const quotationApproved = quotation?.statut === 'approved';
              const isClosed = details.closedAt !== null;
              const lotsData = details.lots || [];
              const lotsSansPesee = lotsData.filter((lot: any) => !lot.poidsReel);

              // Utiliser la même logique que la timeline pour déterminer l'étape actuelle
              let currentStep = 1;
              if (!hasDiagnosis) {
                currentStep = 2;
              } else if (!quotationApproved) {
                currentStep = 3;
              } else if (statut === 'in_collection') {
                currentStep = 4;
              } else if (statut === 'in_progress') {
                currentStep = 5;
              } else if (statut === 'completed' && !isClosed) {
                currentStep = 6;
              } else if (isClosed) {
                currentStep = 7;
              }

              const actions = [];

              // Afficher l'action selon l'étape actuelle
              switch (currentStep) {
                case 2: // Diagnostic en attente
                  actions.push({
                    type: 'urgent',
                    icon: AlertCircle,
                    iconColor: 'text-red-600',
                    bgColor: 'bg-red-500/10',
                    borderColor: 'border-red-500/30',
                    title: 'Planifier visite de diagnostic',
                    description: details.request?.plannedVisitAt
                      ? `Visite prévue le ${new Date(details.request.plannedVisitAt).toLocaleDateString('fr-FR')}`
                      : 'Aucune date planifiée'
                  });
                  break;

                case 3: // Devis en attente
                  if (hasQuotation && quotation.statut === 'sent') {
                    const validiteDate = quotation.validiteAt
                      ? new Date(quotation.validiteAt).toLocaleDateString('fr-FR')
                      : 'Non définie';
                    actions.push({
                      type: 'info',
                      icon: Clock,
                      iconColor: 'text-cyan-600',
                      bgColor: 'bg-cyan-500/10',
                      borderColor: 'border-cyan-500/30',
                      title: 'Attente validation devis',
                      description: `Validité jusqu'au ${validiteDate}`
                    });
                  } else {
                    actions.push({
                      type: 'warning',
                      icon: FileSpreadsheet,
                      iconColor: 'text-yellow-600',
                      bgColor: 'bg-yellow-500/10',
                      borderColor: 'border-yellow-500/30',
                      title: 'Créer le devis',
                      description: `${nombreLots} lots identifiés - ${poidsEstime} kg estimé`
                    });
                  }
                  break;

                case 4: // Collecte en cours
                  actions.push({
                    type: 'info',
                    icon: Truck,
                    iconColor: 'text-cyan-600',
                    bgColor: 'bg-cyan-500/10',
                    borderColor: 'border-cyan-500/30',
                    title: 'Collecte en cours',
                    description: `Transport vers l'entrepôt - Site: ${details.request?.site?.nom || 'Non défini'}`
                  });
                  break;

                case 5: // Réception en cours
                  if (lotsSansPesee.length > 0) {
                    actions.push({
                      type: 'urgent',
                      icon: Weight,
                      iconColor: 'text-red-600',
                      bgColor: 'bg-red-500/10',
                      borderColor: 'border-red-500/30',
                      title: `Pesée manquante pour ${lotsSansPesee.length} lot${lotsSansPesee.length > 1 ? 's' : ''}`,
                      description: lotsSansPesee.map((l: any) => l.code).slice(0, 2).join(', ') + (lotsSansPesee.length > 2 ? '...' : '')
                    });
                  }
                  const lotsATraiter = lotsData.filter((lot: any) => lot.statut === 'pending');
                  if (lotsATraiter.length > 0) {
                    actions.push({
                      type: 'info',
                      icon: Package,
                      iconColor: 'text-cyan-600',
                      bgColor: 'bg-cyan-500/10',
                      borderColor: 'border-cyan-500/30',
                      title: `Traiter ${lotsATraiter.length} lot${lotsATraiter.length > 1 ? 's' : ''}`,
                      description: `Tri et orientation des matériels`
                    });
                  }
                  if (actions.length === 0) {
                    actions.push({
                      type: 'info',
                      icon: Package,
                      iconColor: 'text-cyan-600',
                      bgColor: 'bg-cyan-500/10',
                      borderColor: 'border-cyan-500/30',
                      title: 'Réception en cours',
                      description: `${lotsData.length} lot${lotsData.length > 1 ? 's' : ''} en traitement`
                    });
                  }
                  break;

                case 6: // Clôture en attente
                  actions.push({
                    type: 'warning',
                    icon: CheckCircle2,
                    iconColor: 'text-yellow-600',
                    bgColor: 'bg-yellow-500/10',
                    borderColor: 'border-yellow-500/30',
                    title: 'Prêt à clôturer',
                    description: 'Tous les traitements sont terminés'
                  });
                  break;

                case 7: // Dossier clôturé
                  actions.push({
                    type: 'success',
                    icon: CheckCircle2,
                    iconColor: 'text-emerald-600',
                    bgColor: 'bg-emerald-500/10',
                    borderColor: 'border-emerald-500/30',
                    title: 'Dossier clôturé',
                    description: details.closedAt
                      ? `Clôturé le ${new Date(details.closedAt).toLocaleDateString('fr-FR')}`
                      : 'Dossier terminé'
                  });
                  break;
              }

              return actions.map((action, index) => (
                <div key={index} className={`flex items-start p-2 ${action.bgColor} border ${action.borderColor} rounded-lg transition-all duration-300`}>
                  <action.icon className={`w-4 h-4 ${action.iconColor} mr-2 mt-0.5 flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold text-xs ${text('text-slate-200', 'text-gray-800')}`}>{action.title}</div>
                    <div className={`text-[10px] ${subTextClasses} mt-0.5`}>{action.description}</div>
                  </div>
                </div>
              ));
            })()}
            </div>
        </div>
        </div>

        {/* Carte des Sites - 2/12 sur 27", full width below on iPad */}
        <div className="md:col-span-2 xl:col-span-2">
        <div className={`${bg('bg-slate-900', 'bg-gray-50')} ${border('border-slate-800', 'border-gray-200')} border rounded-xl p-4 h-full flex flex-col`}>
            <h3 className={`text-sm font-semibold ${text('text-slate-200', 'text-gray-800')} mb-3 flex items-center flex-shrink-0`}>
              <MapPin className="w-4 h-4 mr-2 text-cyan-600" />
              Site
            </h3>
            <div className={`flex-1 flex items-center justify-center ${bg('bg-slate-800', 'bg-gray-100')} ${border('border-slate-700', 'border-gray-300')} border rounded`}>
              <div className={`text-center ${mutedTextClasses}`}>
                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Carte interactive</p>
                <p className="text-[10px] mt-1">{details.request?.site?.nom || 'N/A'}</p>
              </div>
            </div>
        </div>
        </div>
      </div>
  );
  };

  const RequestDiagnosisTab = () => {
    if (!selectedCaseFileDetails) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className={`text-sm ${subTextClasses}`}>Sélectionnez un dossier pour voir les détails</div>
        </div>
      );
    }

    const details = selectedCaseFileDetails;
    const request = details.request || {};
    const client = request.client || {};
    const site = request.site || {};
    const contact = request.contact || {};
    const diagnosis = details.diagnosis || null;
    const lotsData = details.lots || [];

    const formatDateTime = (dateString: string) => {
      if (!dateString) return '-';
      const date = new Date(dateString);
      return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const formatDuration = (minutes: number) => {
      if (!minutes) return '-';
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}min`;
    };

    return (
      <div className="space-y-6">
        {/* Informations de la demande */}
        <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-lg p-6`}>
          <h3 className={`text-lg font-semibold ${headingClasses} mb-4 flex items-center`}>
            <FileText className="w-5 h-5 mr-2 text-blue-600" />
            Détails de la Demande
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className={`text-sm ${subTextClasses} mb-1`}>Client</div>
              <div className={`${headingClasses} font-medium`}>{client.raisonSociale || 'Non renseigné'}</div>
              {client.siret && <div className={`text-xs ${subTextClasses} mt-1`}>SIRET: {client.siret}</div>}
            </div>
            <div>
              <div className={`text-sm ${subTextClasses} mb-1`}>Site</div>
              <div className={`${headingClasses} font-medium`}>{site.nom || 'Non renseigné'}</div>
              {site.adresseComplete && <div className={`text-xs ${subTextClasses} mt-1`}>{site.adresseComplete}</div>}
            </div>
            <div>
              <div className={`text-sm ${subTextClasses} mb-1`}>Contact</div>
              <div className={`${headingClasses} font-medium`}>
                {contact.nom || 'Non renseigné'}
                {contact.fonction && <span className={`${subTextClasses}`}> - {contact.fonction}</span>}
              </div>
            </div>
            <div>
              <div className={`text-sm ${subTextClasses} mb-1`}>Téléphone / Email</div>
              <div className={`${headingClasses} font-medium`}>{contact.telephone || 'Non renseigné'}</div>
              {contact.email && <div className={`text-xs ${subTextClasses} mt-1`}>{contact.email}</div>}
            </div>
            <div className="md:col-span-2">
              <div className={`text-sm ${subTextClasses} mb-1`}>Description initiale</div>
              <div className={headingClasses}>
                {request.descriptionInitiale || 'Aucune description fournie'}
              </div>
            </div>
            <div>
              <div className={`text-sm ${subTextClasses} mb-1`}>Catégorie principale</div>
              <div className={`${headingClasses} font-medium capitalize`}>{request.categoriePrincipale || 'Non définie'}</div>
            </div>
            <div>
              <div className={`text-sm ${subTextClasses} mb-1`}>Volume estimé</div>
              <div className={`${headingClasses} font-medium`}>{request.volumeEstime || 'Non estimé'}</div>
            </div>
          </div>
        </div>

        {/* Fiche de visite diagnostic */}
        {diagnosis ? (
          <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-lg p-6`}>
            <h3 className={`text-lg font-semibold ${headingClasses} mb-4 flex items-center`}>
              <Clipboard className="w-5 h-5 mr-2 text-purple-600" />
              Fiche de Visite Diagnostic
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <div className={`text-sm ${subTextClasses} mb-1`}>Technicien</div>
                <div className={`${headingClasses} font-medium`}>{diagnosis.technicienId || 'Non assigné'}</div>
              </div>
              <div>
                <div className={`text-sm ${subTextClasses} mb-1`}>Date de visite</div>
                <div className={`${headingClasses} font-medium`}>{formatDateTime(diagnosis.dateVisite)}</div>
              </div>
              <div>
                <div className={`text-sm ${subTextClasses} mb-1`}>Durée</div>
                <div className={`${headingClasses} font-medium`}>{formatDuration(diagnosis.dureeVisite)}</div>
              </div>
            </div>
            {diagnosis.notes && (
              <div className={`${bg('bg-slate-900', 'bg-gray-50')} ${cardBorderClasses} border rounded-lg p-4`}>
                <div className={`text-sm font-medium ${text('text-slate-300', 'text-gray-700')} mb-2`}>Notes du technicien:</div>
                <div className={`${subTextClasses} text-sm`}>
                  {diagnosis.notes}
                </div>
                <div className="mt-3 flex items-center text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-2" />
                  <span className="text-emerald-600">Diagnostic complété</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-lg p-6`}>
            <h3 className={`text-lg font-semibold ${headingClasses} mb-4 flex items-center`}>
              <Clipboard className="w-5 h-5 mr-2 text-purple-600" />
              Fiche de Visite Diagnostic
            </h3>
            <div className="text-center py-8">
              <div className={`text-sm ${subTextClasses}`}>Aucun diagnostic effectué pour ce dossier</div>
            </div>
          </div>
        )}

        {/* Liste des lots diagnostiqués */}
        <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-lg p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold ${headingClasses} flex items-center`}>
              <Package className="w-5 h-5 mr-2 text-cyan-600" />
              Lots Diagnostiqués ({lotsData.length})
            </h3>
            <button
              onClick={() => setIsLotModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
            >
              <Plus className="w-4 h-4" />
              Ajouter un Lot
            </button>
          </div>
          {lotsData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${border('border-slate-700', 'border-gray-200')}`}>
                    <th className={`text-left py-3 px-4 text-sm font-medium ${subTextClasses}`}>Code Lot</th>
                    <th className={`text-left py-3 px-4 text-sm font-medium ${subTextClasses}`}>Catégorie</th>
                    <th className={`text-left py-3 px-4 text-sm font-medium ${subTextClasses}`}>Grade</th>
                    <th className={`text-left py-3 px-4 text-sm font-medium ${subTextClasses}`}>Orientation</th>
                    <th className={`text-right py-3 px-4 text-sm font-medium ${subTextClasses}`}>Poids Est. (kg)</th>
                    <th className={`text-right py-3 px-4 text-sm font-medium ${subTextClasses}`}>Poids Réel (kg)</th>
                    <th className={`text-left py-3 px-4 text-sm font-medium ${subTextClasses}`}>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {lotsData.map((lot: any) => (
                    <tr key={lot.id} className={`border-b ${border('border-slate-700/50', 'border-gray-100')} ${bg('hover:bg-slate-700/30', 'hover:bg-gray-50')}`}>
                      <td className="py-3 px-4">
                        <div className={`font-medium ${headingClasses}`}>{lot.code}</div>
                        <div className={`text-xs ${subTextClasses}`}>{lot.qrCode}</div>
                      </td>
                      <td className={`py-3 px-4 ${text('text-slate-300', 'text-gray-700')}`}>{lot.categorieName || 'Non défini'}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${getGradeColor(lot.grade)}`}>
                          Grade {lot.grade}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-sm ${text('text-slate-300', 'text-gray-700')} capitalize`}>{lot.orientation.replace('_', ' ')}</span>
                      </td>
                      <td className={`py-3 px-4 text-right ${headingClasses} font-medium`}>{lot.poidsEstime || 0}</td>
                      <td className="py-3 px-4 text-right">
                        {lot.poidsReel ? (
                          <span className="text-emerald-600 font-medium">{lot.poidsReel}</span>
                        ) : (
                          <span className={subTextClasses}>-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${getStatusColor(lot.statut)}`}>
                          {lot.statut}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className={`text-sm ${subTextClasses}`}>Aucun lot diagnostiqué pour ce dossier</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const QuotationTab = () => {
    const [isAddingLine, setIsAddingLine] = useState(false);
    const [editingLineId, setEditingLineId] = useState<string | null>(null);
    const [newLine, setNewLine] = useState({
      typeLigne: 'service',
      description: '',
      unite: 'forfait',
      quantite: 1,
      prixUnitaire: 0,
      tauxTVA: 20,
    });

    if (!selectedCaseFileDetails) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className={`text-sm ${subTextClasses}`}>Sélectionnez un dossier pour voir les détails</div>
        </div>
      );
    }

    const details = selectedCaseFileDetails;
    const quotations = details.quotations || [];

    if (quotations.length === 0) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className={`text-sm ${subTextClasses}`}>Aucun devis disponible pour ce dossier</div>
        </div>
      );
    }

    const quotation = quotations[0]; // Prendre le devis le plus récent
    const lines = quotation.lines || [];

    const handleAddLine = async (e: React.FormEvent) => {
      e.preventDefault();

      try {
        const response = await fetch(`https://valotik-api-546691893264.europe-west1.run.app/api/quotations/${quotation.id}/lines`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newLine),
        });

        const result = await response.json();

        if (result.success) {
          // Réinitialiser le formulaire
          setNewLine({
            typeLigne: 'service',
            description: '',
            unite: 'forfait',
            quantite: 1,
            prixUnitaire: 0,
            tauxTVA: 20,
          });
          setIsAddingLine(false);

          // Recharger les détails du dossier
          loadCaseFileDetails();
        } else {
          alert('Erreur lors de l\'ajout de la ligne: ' + result.error);
        }
      } catch (error) {
        console.error('Erreur lors de l\'ajout de la ligne:', error);
        alert('Erreur lors de l\'ajout de la ligne');
      }
    };

    const handleUpdateLine = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!editingLineId) return;

      try {
        const response = await fetch(`https://valotik-api-546691893264.europe-west1.run.app/api/quotations/${quotation.id}/lines/${editingLineId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newLine),
        });

        const result = await response.json();

        if (result.success) {
          // Réinitialiser le formulaire
          setNewLine({
            typeLigne: 'service',
            description: '',
            unite: 'forfait',
            quantite: 1,
            prixUnitaire: 0,
            tauxTVA: 20,
          });
          setEditingLineId(null);
          setIsAddingLine(false);

          // Recharger les détails du dossier
          loadCaseFileDetails();
        } else {
          alert('Erreur lors de la mise à jour de la ligne: ' + result.error);
        }
      } catch (error) {
        console.error('Erreur lors de la mise à jour de la ligne:', error);
        alert('Erreur lors de la mise à jour de la ligne');
      }
    };

    const handleDeleteLine = async (lineId: string, e?: React.MouseEvent) => {
      if (e) {
        e.stopPropagation();
      }

      if (!confirm('Êtes-vous sûr de vouloir supprimer cette ligne ?')) {
        return;
      }

      try {
        const response = await fetch(`https://valotik-api-546691893264.europe-west1.run.app/api/quotations/${quotation.id}/lines/${lineId}`, {
          method: 'DELETE',
        });

        const result = await response.json();

        if (result.success) {
          // Recharger les détails du dossier
          loadCaseFileDetails();
        } else {
          alert('Erreur lors de la suppression de la ligne: ' + result.error);
        }
      } catch (error) {
        console.error('Erreur lors de la suppression de la ligne:', error);
        alert('Erreur lors de la suppression de la ligne');
      }
    };

    const handleEditLine = (line: any) => {
      setEditingLineId(line.id);
      setNewLine({
        typeLigne: line.typeLigne,
        description: line.description,
        unite: line.unite,
        quantite: line.quantite,
        prixUnitaire: line.prixUnitaire,
        tauxTVA: line.tauxTVA,
      });
      setIsAddingLine(true);
    };

    const loadCaseFileDetails = async () => {
      if (!selectedCaseFile) return;

      try {
        const response = await fetch(`https://valotik-api-546691893264.europe-west1.run.app/api/case-files/${selectedCaseFile}`);
        const result = await response.json();

        if (result.success && result.data) {
          setSelectedCaseFileDetails(result.data);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des détails du dossier:', error);
      }
    };

    const totalHT = quotation.montantHT || 0;
    const totalTVA = quotation.montantTVA || 0;
    const totalTTC = quotation.montantTTC || 0;

    const getQuotationStatusColor = (status: string) => {
      switch (status) {
        case 'approved':
          return 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30';
        case 'sent':
          return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
        case 'draft':
          return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
        case 'rejected':
          return 'bg-red-500/20 text-red-700 border-red-500/30';
        default:
          return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
      }
    };

    const getQuotationStatusLabel = (status: string) => {
      switch (status) {
        case 'approved':
          return 'Approuvé par client';
        case 'sent':
          return 'Envoyé au client';
        case 'draft':
          return 'Brouillon';
        case 'rejected':
          return 'Refusé';
        default:
          return status;
      }
    };

    const formatDate = (dateString: string) => {
      if (!dateString) return '-';
      return new Date(dateString).toLocaleDateString('fr-FR');
    };

    return (
      <div className="space-y-6">
        {/* En-tête devis */}
        <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-lg p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold ${headingClasses} flex items-center`}>
              <FileSpreadsheet className="w-5 h-5 mr-2 text-emerald-600" />
              Devis {details.reference} - Version {quotation.version || 1}
            </h3>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center">
                <Download className="w-4 h-4 mr-2" />
                Générer PDF
              </button>
              <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors">
                Envoyer
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className={`text-sm ${subTextClasses} mb-1`}>Statut</div>
              <span className={`inline-block px-3 py-1 rounded-lg text-sm font-medium border ${getQuotationStatusColor(quotation.statut)}`}>
                {getQuotationStatusLabel(quotation.statut)}
              </span>
            </div>
            <div>
              <div className={`text-sm ${subTextClasses} mb-1`}>Date de création</div>
              <div className={`${headingClasses} font-medium`}>{formatDate(quotation.createdAt)}</div>
            </div>
            <div>
              <div className={`text-sm ${subTextClasses} mb-1`}>Validité</div>
              <div className={`${headingClasses} font-medium`}>
                {quotation.validiteAt ? `Jusqu'au ${formatDate(quotation.validiteAt)}` : 'Non définie'}
              </div>
            </div>
          </div>
        </div>

        {/* Tableau des lignes */}
        <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-lg p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold ${headingClasses}`}>Lignes de Devis</h3>
            <button
              onClick={() => setIsAddingLine(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une ligne
            </button>
          </div>

          {/* Formulaire d'ajout/édition de ligne */}
          {isAddingLine && (
            <form onSubmit={editingLineId ? handleUpdateLine : handleAddLine} className={`mb-4 p-3 rounded-lg border ${border('border-slate-700', 'border-gray-200')} ${bg('bg-slate-700/30', 'bg-gray-50')}`}>
              <div className="flex items-end gap-2">
                <div className="w-32">
                  <label className={`block text-xs font-medium ${subTextClasses} mb-1`}>Type</label>
                  <select
                    value={newLine.typeLigne}
                    onChange={(e) => setNewLine({ ...newLine, typeLigne: e.target.value })}
                    className={`w-full ${inputClasses} border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    required
                  >
                    <option value="service">Service</option>
                    <option value="material">Matériel</option>
                    <option value="package">Forfait</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className={`block text-xs font-medium ${subTextClasses} mb-1`}>Description</label>
                  <input
                    type="text"
                    value={newLine.description}
                    onChange={(e) => setNewLine({ ...newLine, description: e.target.value })}
                    className={`w-full ${inputClasses} border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    required
                  />
                </div>
                <div className="w-28">
                  <label className={`block text-xs font-medium ${subTextClasses} mb-1`}>Unité</label>
                  <select
                    value={newLine.unite}
                    onChange={(e) => setNewLine({ ...newLine, unite: e.target.value })}
                    className={`w-full ${inputClasses} border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    required
                  >
                    <option value="forfait">Forfait</option>
                    <option value="heure">Heure</option>
                    <option value="jour">Jour</option>
                    <option value="unité">Unité</option>
                    <option value="kg">Kg</option>
                    <option value="tonne">Tonne</option>
                    <option value="m3">M³</option>
                    <option value="lot">Lot</option>
                  </select>
                </div>
                <div className="w-24">
                  <label className={`block text-xs font-medium ${subTextClasses} mb-1`}>Qté</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newLine.quantite}
                    onChange={(e) => setNewLine({ ...newLine, quantite: parseFloat(e.target.value) || 0 })}
                    className={`w-full ${inputClasses} border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    required
                  />
                </div>
                <div className="w-28">
                  <label className={`block text-xs font-medium ${subTextClasses} mb-1`}>Prix U. (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newLine.prixUnitaire}
                    onChange={(e) => setNewLine({ ...newLine, prixUnitaire: parseFloat(e.target.value) || 0 })}
                    className={`w-full ${inputClasses} border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    required
                  />
                </div>
                <div className="w-24">
                  <label className={`block text-xs font-medium ${subTextClasses} mb-1`}>TVA (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newLine.tauxTVA}
                    onChange={(e) => setNewLine({ ...newLine, tauxTVA: parseFloat(e.target.value) || 20 })}
                    className={`w-full ${inputClasses} border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    required
                  />
                </div>
                <div className="flex gap-1">
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
                    title={editingLineId ? "Mettre à jour" : "Ajouter"}
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingLine(false);
                      setEditingLineId(null);
                      setNewLine({
                        typeLigne: 'service',
                        description: '',
                        unite: 'forfait',
                        quantite: 1,
                        prixUnitaire: 0,
                        tauxTVA: 20,
                      });
                    }}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${bg('bg-slate-700', 'bg-gray-200')} ${text('text-slate-300', 'text-gray-700')} ${bg('hover:bg-slate-600', 'hover:bg-gray-300')}`}
                    title="Annuler"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </form>
          )}

          {lines.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${border('border-slate-700', 'border-gray-200')}`}>
                    <th className={`text-left py-3 px-4 text-sm font-medium ${subTextClasses}`}>Type</th>
                    <th className={`text-left py-3 px-4 text-sm font-medium ${subTextClasses}`}>Description</th>
                    <th className={`text-left py-3 px-4 text-sm font-medium ${subTextClasses}`}>Unité</th>
                    <th className={`text-right py-3 px-4 text-sm font-medium ${subTextClasses}`}>Quantité</th>
                    <th className={`text-right py-3 px-4 text-sm font-medium ${subTextClasses}`}>Prix Unit.</th>
                    <th className={`text-right py-3 px-4 text-sm font-medium ${subTextClasses}`}>TVA</th>
                    <th className={`text-right py-3 px-4 text-sm font-medium ${subTextClasses}`}>Total HT</th>
                    <th className={`text-center py-3 px-4 text-sm font-medium ${subTextClasses}`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line: any) => {
                    const lineTotal = (line.quantite || 0) * (line.prixUnitaire || 0);
                    const isEditing = editingLineId === line.id;
                    return (
                      <tr
                        key={line.id}
                        onClick={() => handleEditLine(line)}
                        className={`border-b ${border('border-slate-700/50', 'border-gray-100')} ${bg('hover:bg-slate-700/30', 'hover:bg-gray-50')} cursor-pointer transition-colors ${isEditing ? bg('bg-blue-500/10', 'bg-blue-50') : ''}`}
                      >
                        <td className="py-2 px-3">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              line.typeLigne === 'service'
                                ? 'bg-blue-500/20 text-blue-700 border border-blue-500/30'
                                : line.typeLigne === 'material'
                                ? 'bg-purple-500/20 text-purple-700 border border-purple-500/30'
                                : 'bg-cyan-500/20 text-cyan-700 border border-cyan-500/30'
                            }`}
                          >
                            {line.typeLigne === 'service' ? 'Service' : line.typeLigne === 'material' ? 'Matériel' : 'Forfait'}
                          </span>
                        </td>
                        <td className={`py-2 px-3 ${text('text-slate-300', 'text-gray-700')}`}>{line.description}</td>
                        <td className={`py-2 px-3 ${subTextClasses} text-sm`}>{line.unite}</td>
                        <td className={`py-2 px-3 text-right ${headingClasses} font-medium`}>{line.quantite}</td>
                        <td className={`py-2 px-3 text-right ${headingClasses}`}>{(line.prixUnitaire || 0).toFixed(2)} €</td>
                        <td className={`py-2 px-3 text-right ${subTextClasses} text-sm`}>{line.tauxTVA}%</td>
                        <td className="py-2 px-3 text-right text-emerald-600 font-medium">{lineTotal.toFixed(2)} €</td>
                        <td className="py-2 px-3 text-center">
                          <button
                            onClick={(e) => handleDeleteLine(line.id, e)}
                            className="inline-flex items-center justify-center w-7 h-7 rounded-lg hover:bg-red-500/20 text-red-600 hover:text-red-700 transition-colors"
                            title="Supprimer cette ligne"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className={`text-sm ${subTextClasses}`}>Aucune ligne de devis</div>
            </div>
          )}
        </div>

        {/* Résumé financier */}
        <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-lg p-6`}>
          <h3 className={`text-lg font-semibold ${headingClasses} mb-4`}>Résumé Financier</h3>
          <div className="max-w-md ml-auto space-y-3">
            <div className="flex justify-between items-center pb-2">
              <span className={subTextClasses}>Total HT</span>
              <span className={`${headingClasses} font-medium text-lg`}>{totalHT.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between items-center pb-2">
              <span className={subTextClasses}>TVA (20%)</span>
              <span className={`${headingClasses} font-medium text-lg`}>{totalTVA.toFixed(2)} €</span>
            </div>
            <div className={`flex justify-between items-center pt-3 border-t-2 ${border('border-slate-700', 'border-gray-300')}`}>
              <span className={`${headingClasses} font-semibold text-lg`}>Total TTC</span>
              <span className="text-emerald-600 font-bold text-2xl">{totalTTC.toFixed(2)} €</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const LogisticsTab = () => {
    if (!selectedCaseFileDetails) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className={`text-sm ${subTextClasses}`}>Sélectionnez un dossier pour voir les informations logistiques</div>
        </div>
      );
    }

    const details = selectedCaseFileDetails;
    const request = details.request || {};
    const client = request.client || {};
    const site = request.site || {};
    const diagnosis = details.diagnosis || null;
    const lotsData = details.lots || [];
    const transportOrdersData = details.transportOrders || [];

    // Créer le planning des opérations basé sur les données réelles
    const operations = [];
    const formatDate = (dateString: string) => {
      if (!dateString) return '-';
      return new Date(dateString).toLocaleDateString('fr-FR');
    };

    const formatTime = (dateString: string) => {
      if (!dateString) return '-';
      return new Date(dateString).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    };

    // 1. Demande créée (toujours complétée)
    operations.push({
      date: formatDate(details.createdAt),
      time: formatTime(details.createdAt),
      type: 'Demande d\'enlèvement créée',
      status: 'completed'
    });

    // 2. Visite diagnostic si planifiée ou effectuée
    if (request.plannedVisitAt) {
      const visitPassed = new Date(request.plannedVisitAt) < new Date();
      operations.push({
        date: formatDate(request.plannedVisitAt),
        time: formatTime(request.plannedVisitAt),
        type: 'Visite de diagnostic sur site',
        status: diagnosis ? 'completed' : (visitPassed ? 'in_progress' : 'planned')
      });
    }

    // 3. Enlèvement si le dossier est en cours de collecte ou après
    if (['in_collection', 'in_progress', 'completed'].includes(details.statut)) {
      operations.push({
        date: diagnosis ? formatDate(diagnosis.dateVisite) : '-',
        time: '09:00-12:00',
        type: 'Enlèvement site client',
        status: details.statut === 'in_collection' ? 'in_progress' : 'completed'
      });

      // 4. Transport vers entrepôt
      operations.push({
        date: diagnosis ? formatDate(diagnosis.dateVisite) : '-',
        time: '14:00-16:00',
        type: 'Transport vers entrepôt',
        status: ['in_progress', 'completed'].includes(details.statut) ? 'completed' : 'in_progress'
      });
    }

    // 5. Réception et pesée si en cours ou terminé
    if (['in_progress', 'completed'].includes(details.statut)) {
      operations.push({
        date: details.poidsReel ? formatDate(details.updatedAt) : '-',
        time: '10:00-11:00',
        type: 'Réception et pesée',
        status: details.poidsReel ? 'completed' : 'in_progress'
      });
    }

    // 6. Traitement des lots si applicable
    if (details.statut === 'completed' && lotsData.length > 0) {
      operations.push({
        date: formatDate(details.closedAt || details.updatedAt),
        time: '08:00-17:00',
        type: `Traitement des ${lotsData.length} lots`,
        status: 'completed'
      });
    }

    return (
      <div className="space-y-6">
        {/* Timeline des Sites */}
        <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-lg p-6`}>
          <h3 className={`text-lg font-semibold ${headingClasses} mb-6 flex items-center`}>
            <MapPin className="w-5 h-5 mr-2 text-red-600" />
            Parcours Logistique
          </h3>

          <div className="relative">
            {/* Déterminer les étapes actives en fonction du statut et des lots */}
            {(() => {
              const activeSteps = {
                client: true, // Toujours présent
                warehouse: ['in_collection', 'in_progress', 'completed'].includes(details.statut),
                dismantling: lotsData.some((lot: any) => lot.orientation === 'dismantling'),
                physicalStore: lotsData.some((lot: any) => lot.orientation === 'resale'),
                ecommerce: lotsData.some((lot: any) => lot.orientation === 'resale' || lot.orientation === 'refurbishment'),
              };

              const activeStepsCount = Object.values(activeSteps).filter(Boolean).length;

              return (
                <>
                  {/* Ligne de timeline dynamique */}
                  <div className={`absolute top-12 left-8 right-8 h-0.5 ${bg('bg-slate-700', 'bg-gray-300')}`}></div>

                  {/* Sites - Grid dynamique */}
                  <div className={`grid grid-cols-1 md:grid-cols-${activeStepsCount} gap-4 relative`}>
              {/* Site Client (Enlèvement) */}
              <div className="flex flex-col items-center">
                <div className={`w-16 h-16 rounded-full ${bg('bg-blue-500/10', 'bg-blue-50')} ${border('border-blue-500/30', 'border-blue-200')} border-2 flex items-center justify-center mb-3 relative z-10`}>
                  <Building2 className="w-8 h-8 text-blue-600" />
                </div>
                <div className={`text-xs font-semibold ${headingClasses} mb-1 text-center`}>CLIENT</div>
                <div className={`text-xs ${subTextClasses} text-center mb-2`}>Enlèvement</div>
                <div className={`${bg('bg-slate-900', 'bg-gray-50')} ${cardBorderClasses} border rounded-lg p-3 w-full`}>
                  <div className={`text-xs font-medium ${headingClasses} mb-1`}>{client.raisonSociale}</div>
                  <div className={`text-xs ${text('text-slate-400', 'text-gray-600')} leading-relaxed`}>{site.adresseComplete}</div>
                  {request.accessNotes && (
                    <div className={`text-xs ${text('text-slate-500', 'text-gray-500')} mt-2 italic`}>
                      Note: {request.accessNotes}
                    </div>
                  )}
                </div>
              </div>

                    {/* Entrepôt - Conditionnel */}
                    {activeSteps.warehouse && (
                      <div className="flex flex-col items-center">
                        <div className={`w-16 h-16 rounded-full ${bg('bg-purple-500/10', 'bg-purple-50')} ${border('border-purple-500/30', 'border-purple-200')} border-2 flex items-center justify-center mb-3 relative z-10`}>
                          <Package className="w-8 h-8 text-purple-600" />
                        </div>
                        <div className={`text-xs font-semibold ${headingClasses} mb-1 text-center`}>ENTREPÔT</div>
                        <div className={`text-xs ${subTextClasses} text-center mb-2`}>Stockage</div>
                        <div className={`${bg('bg-slate-900', 'bg-gray-50')} ${cardBorderClasses} border rounded-lg p-3 w-full`}>
                          <div className={`text-xs font-medium ${headingClasses} mb-1`}>D3E Valotik</div>
                          <div className={`text-xs ${text('text-slate-400', 'text-gray-600')} leading-relaxed`}>
                            Zone A - Allée 3<br/>
                            15 Rue de l'Industrie<br/>
                            75015 Paris
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Démantèlement - Conditionnel */}
                    {activeSteps.dismantling && (
                      <div className="flex flex-col items-center">
                        <div className={`w-16 h-16 rounded-full ${bg('bg-orange-500/10', 'bg-orange-50')} ${border('border-orange-500/30', 'border-orange-200')} border-2 flex items-center justify-center mb-3 relative z-10`}>
                          <Settings className="w-8 h-8 text-orange-600" />
                        </div>
                        <div className={`text-xs font-semibold ${headingClasses} mb-1 text-center`}>DÉMANTÈLEMENT</div>
                        <div className={`text-xs ${subTextClasses} text-center mb-2`}>Traitement</div>
                        <div className={`${bg('bg-slate-900', 'bg-gray-50')} ${cardBorderClasses} border rounded-lg p-3 w-full`}>
                          <div className={`text-xs font-medium ${headingClasses} mb-1`}>Atelier Recyclage</div>
                          <div className={`text-xs ${text('text-slate-400', 'text-gray-600')} leading-relaxed`}>
                            Bâtiment B<br/>
                            Zone Industrielle Nord<br/>
                            93400 Saint-Ouen
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Magasin Physique - Conditionnel */}
                    {activeSteps.physicalStore && (
                      <div className="flex flex-col items-center">
                        <div className={`w-16 h-16 rounded-full ${bg('bg-emerald-500/10', 'bg-emerald-50')} ${border('border-emerald-500/30', 'border-emerald-200')} border-2 flex items-center justify-center mb-3 relative z-10`}>
                          <Home className="w-8 h-8 text-emerald-600" />
                        </div>
                        <div className={`text-xs font-semibold ${headingClasses} mb-1 text-center`}>MAGASIN</div>
                        <div className={`text-xs ${subTextClasses} text-center mb-2`}>Vente Physique</div>
                        <div className={`${bg('bg-slate-900', 'bg-gray-50')} ${cardBorderClasses} border rounded-lg p-3 w-full`}>
                          <div className={`text-xs font-medium ${headingClasses} mb-1`}>Boutique SecondeTech</div>
                          <div className={`text-xs ${text('text-slate-400', 'text-gray-600')} leading-relaxed`}>
                            42 Avenue de la République<br/>
                            75011 Paris
                          </div>
                        </div>
                      </div>
                    )}

                    {/* E-Commerce - Conditionnel */}
                    {activeSteps.ecommerce && (
                      <div className="flex flex-col items-center">
                        <div className={`w-16 h-16 rounded-full ${bg('bg-cyan-500/10', 'bg-cyan-50')} ${border('border-cyan-500/30', 'border-cyan-200')} border-2 flex items-center justify-center mb-3 relative z-10`}>
                          <Monitor className="w-8 h-8 text-cyan-600" />
                        </div>
                        <div className={`text-xs font-semibold ${headingClasses} mb-1 text-center`}>E-COMMERCE</div>
                        <div className={`text-xs ${subTextClasses} text-center mb-2`}>Vente en Ligne</div>
                        <div className={`${bg('bg-slate-900', 'bg-gray-50')} ${cardBorderClasses} border rounded-lg p-3 w-full`}>
                          <div className={`text-xs font-medium ${headingClasses} mb-1`}>Marketplace D3E</div>
                          <div className={`text-xs ${text('text-slate-400', 'text-gray-600')} leading-relaxed`}>
                            www.d3e-market.fr<br/>
                            Plateforme en ligne<br/>
                            24/7 Accessible
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Légende */}
                  <div className={`mt-6 pt-4 border-t ${border('border-slate-700', 'border-gray-200')}`}>
                    <div className="flex flex-wrap gap-4 justify-center">
                      {activeSteps.client && (
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full bg-blue-500`}></div>
                          <span className={`text-xs ${subTextClasses}`}>Point d'enlèvement</span>
                        </div>
                      )}
                      {activeSteps.warehouse && (
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full bg-purple-500`}></div>
                          <span className={`text-xs ${subTextClasses}`}>Stockage temporaire</span>
                        </div>
                      )}
                      {activeSteps.dismantling && (
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full bg-orange-500`}></div>
                          <span className={`text-xs ${subTextClasses}`}>Traitement/Tri</span>
                        </div>
                      )}
                      {activeSteps.physicalStore && (
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full bg-emerald-500`}></div>
                          <span className={`text-xs ${subTextClasses}`}>Distribution physique</span>
                        </div>
                      )}
                      {activeSteps.ecommerce && (
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full bg-cyan-500`}></div>
                          <span className={`text-xs ${subTextClasses}`}>Distribution digitale</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Planning des opérations */}
        <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-lg p-6`}>
          <h3 className={`text-lg font-semibold ${headingClasses} mb-4 flex items-center`}>
              <Calendar className="w-5 h-5 mr-2 text-blue-600" />
              Planning des Opérations
          </h3>
          <div className="space-y-3">
              {operations.map((operation, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    operation.status === 'completed'
                      ? `${bg('bg-emerald-500/10', 'bg-emerald-50')} ${border('border-emerald-500/30', 'border-emerald-200')}`
                      : operation.status === 'in_progress'
                      ? `${bg('bg-blue-500/10', 'bg-blue-50')} ${border('border-blue-500/30', 'border-blue-200')}`
                      : `${bg('bg-slate-700/30', 'bg-gray-100')} ${border('border-slate-600', 'border-gray-300')}`
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className={`text-sm ${subTextClasses}`}>Date</div>
                      <div className={`${headingClasses} font-medium`}>{operation.date}</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-sm ${subTextClasses}`}>Horaire</div>
                      <div className={`${headingClasses} font-medium`}>{operation.time}</div>
                    </div>
                    <div className="ml-4">
                      <div className={`${headingClasses} font-medium`}>{operation.type}</div>
                    </div>
                  </div>
                  <div>
                    {operation.status === 'completed' && (
                      <CheckCircle2 className={`w-6 h-6 ${text('text-emerald-600', 'text-emerald-600')}`} />
                    )}
                    {operation.status === 'in_progress' && (
                      <Clock className={`w-6 h-6 ${text('text-blue-600', 'text-blue-600')} animate-pulse`} />
                    )}
                    {operation.status === 'planned' && (
                      <Calendar className={`w-6 h-6 ${subTextClasses}`} />
                    )}
                  </div>
                </div>
              ))}
          </div>
          </div>

        {/* Ordres de transport */}
        <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-lg p-6`}>
          <h3 className={`text-lg font-semibold ${headingClasses} mb-4 flex items-center`}>
              <Truck className="w-5 h-5 mr-2 text-purple-600" />
              Ordres de Transport
          </h3>
          {transportOrdersData.length > 0 ? (
              <div className="space-y-4">
                {transportOrdersData.map((order: any) => (
                  <div key={order.id} className={`${bg('bg-slate-900', 'bg-gray-50')} ${cardBorderClasses} border rounded-lg p-4`}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className={`font-medium ${headingClasses} text-lg`}>{order.type}</div>
                        <div className={`text-sm ${subTextClasses}`}>{order.id}</div>
                      </div>
                      <span className={`inline-block px-3 py-1 rounded-lg text-sm font-medium border ${getStatusColor(order.statut)}`}>
                        {getStatusLabel(order.statut)}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <div className={`text-xs ${subTextClasses} mb-1`}>Transporteur</div>
                        <div className={`${headingClasses} font-medium`}>{order.transporteurName || 'Non assigné'}</div>
                      </div>
                      <div>
                        <div className={`text-xs ${subTextClasses} mb-1`}>Véhicule</div>
                        <div className={`${headingClasses} font-medium`}>{order.vehicule || 'Non défini'}</div>
                      </div>
                      <div>
                        <div className={`text-xs ${subTextClasses} mb-1`}>Conducteur</div>
                        <div className={`${headingClasses} font-medium`}>{order.conducteur || 'Non assigné'}</div>
                      </div>
                      <div>
                        <div className={`text-xs ${subTextClasses} mb-1`}>Date planifiée</div>
                        <div className={`${headingClasses} font-medium`}>{formatDate(order.datePlanifiee)}</div>
                      </div>
                    </div>
                    {order.documents && (
                      <div className={`mt-3 pt-3 border-t ${border('border-slate-700', 'border-gray-200')}`}>
                        <div className={`text-xs ${subTextClasses} mb-2`}>Documents</div>
                        <div className="flex gap-2">
                          {JSON.parse(order.documents || '[]').map((doc: string, i: number) => (
                            <span
                              key={i}
                              className={`inline-flex items-center px-2 py-1 ${bg('bg-slate-700', 'bg-gray-200')} rounded text-xs ${text('text-slate-300', 'text-gray-700')}`}
                            >
                              <FileText className="w-3 h-3 mr-1" />
                              {doc}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
          ) : (
              <div className="text-center py-8">
                <Truck className={`w-12 h-12 mx-auto mb-2 opacity-30 ${subTextClasses}`} />
                <div className={`text-sm ${subTextClasses}`}>Aucun ordre de transport créé pour ce dossier</div>
              </div>
          )}
          </div>
      </div>
    );
  };

  const InventoryTab = () => {
    if (!selectedCaseFileDetails) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className={`text-sm ${subTextClasses}`}>Sélectionnez un dossier pour voir l'inventaire</div>
        </div>
      );
    }

    const details = selectedCaseFileDetails;
    const lotsData = details.lots || [];

    // Debug: afficher les données dans la console
    console.log('📦 Lots chargés:', lotsData);
    console.log('🔧 Composants du premier lot:', lotsData[0]?.components);

    if (lotsData.length === 0) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className={`text-sm ${subTextClasses}`}>Aucun lot en stock pour ce dossier</div>
        </div>
      );
    }

    const formatDate = (dateString: string) => {
      if (!dateString) return '-';
      return new Date(dateString).toLocaleDateString('fr-FR');
    };

    return (
    <div className="space-y-6">
      {/* Actions rapides */}
      <div className="flex gap-3">
        <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center">
          <QrCode className="w-4 h-4 mr-2" />
          Scanner QR Code
        </button>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Générer Étiquettes
        </button>
      </div>

      {/* Tableau inventaire */}
      <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-lg p-6`}>
        <h3 className={`text-lg font-semibold ${headingClasses} mb-4 flex items-center`}>
          <Package className="w-5 h-5 mr-2 text-purple-600" />
          Lots en Stock ({lotsData.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${border('border-slate-700', 'border-gray-200')}`}>
                <th className={`text-left py-3 px-4 text-sm font-medium ${subTextClasses}`}>QR Code</th>
                <th className={`text-left py-3 px-4 text-sm font-medium ${subTextClasses}`}>Code Lot</th>
                <th className={`text-left py-3 px-4 text-sm font-medium ${subTextClasses}`}>Catégorie</th>
                <th className={`text-left py-3 px-4 text-sm font-medium ${subTextClasses}`}>Grade</th>
                <th className={`text-left py-3 px-4 text-sm font-medium ${subTextClasses}`}>Orientation</th>
                <th className={`text-right py-3 px-4 text-sm font-medium ${subTextClasses}`}>Poids (kg)</th>
                <th className={`text-left py-3 px-4 text-sm font-medium ${subTextClasses}`}>Date Création</th>
                <th className={`text-left py-3 px-4 text-sm font-medium ${subTextClasses}`}>Statut</th>
                <th className={`text-center py-3 px-4 text-sm font-medium ${subTextClasses}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {lotsData.map((lot: any) => (
                <React.Fragment key={lot.id}>
                  {/* Ligne principale du lot */}
                  <tr
                    onClick={() => setExpandedLotId(expandedLotId === lot.id ? null : lot.id)}
                    className={`border-b ${border('border-slate-700/50', 'border-gray-100')} ${bg('hover:bg-slate-700/30', 'hover:bg-gray-50')} cursor-pointer transition-colors`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <ChevronRight
                          className={`w-4 h-4 mr-2 ${subTextClasses} transition-transform ${expandedLotId === lot.id ? 'rotate-90' : ''}`}
                        />
                        <QrCode className={`w-4 h-4 mr-2 ${subTextClasses}`} />
                        <span className={`${text('text-slate-300', 'text-gray-700')} font-mono text-sm`}>{lot.qrCode}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className={`font-medium ${headingClasses}`}>{lot.code}</div>
                    </td>
                    <td className={`py-3 px-4 ${text('text-slate-300', 'text-gray-700')}`}>{lot.categorieName || 'Non défini'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${getGradeColor(lot.grade)}`}>
                        Grade {lot.grade}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-sm ${text('text-slate-300', 'text-gray-700')} capitalize`}>{lot.orientation.replace('_', ' ')}</span>
                    </td>
                    <td className={`py-3 px-4 text-right ${headingClasses} font-medium`}>
                      {lot.poidsReel || lot.poidsEstime || 0}
                    </td>
                    <td className={`py-3 px-4 ${text('text-slate-300', 'text-gray-700')}`}>{formatDate(lot.createdAt)}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${getStatusColor(lot.statut)}`}>
                        {lot.statut}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLotForDismantling(lot);
                            setIsDismantlingPanelOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white text-xs font-medium transition-all shadow-md shadow-purple-500/30 flex items-center gap-1.5"
                          title="Démanteler le lot"
                        >
                          <Split className="w-3.5 h-3.5" />
                          ÉCLATER
                        </button>
                        <span className={`text-xs ${subTextClasses} flex items-center`}>
                          {lot.components?.length || 0} composants
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* Accordéon des composants */}
                  {expandedLotId === lot.id && (
                    <tr className={`${bg('bg-slate-800/50', 'bg-gray-50')}`}>
                      <td colSpan={9} className="p-0">
                        <div className="p-4 animate-slideDown">
                          <div className={`${bg('bg-slate-900', 'bg-white')} rounded-lg ${border('border-slate-700', 'border-gray-200')} border p-4`}>
                            <h4 className={`text-sm font-semibold ${headingClasses} mb-3 flex items-center`}>
                              <Package className="w-4 h-4 mr-2 text-purple-600" />
                              Composants du lot {lot.code}
                            </h4>
                            {lot.components && lot.components.length > 0 ? (
                              <div className="space-y-2">
                                {lot.components.map((component: any) => (
                                  <div
                                    key={component.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedComponent(component);
                                      setIsComponentPanelOpen(true);
                                    }}
                                    className={`flex items-center justify-between p-3 ${bg('bg-slate-800', 'bg-gray-50')} ${border('border-slate-700', 'border-gray-200')} border rounded-lg ${bg('hover:bg-slate-700', 'hover:bg-gray-100')} cursor-pointer transition-colors`}
                                  >
                                    <div className="flex items-center gap-4 flex-1">
                                      <div className={`w-10 h-10 rounded ${bg('bg-slate-700', 'bg-gray-200')} flex items-center justify-center`}>
                                        <FileEdit className={`w-5 h-5 ${subTextClasses}`} />
                                      </div>
                                      <div className="flex-1">
                                        <div className={`font-medium ${headingClasses} text-sm`}>
                                          {component.quantite > 1 && `${component.quantite}x `}
                                          {component.nom || component.categorieName}
                                        </div>
                                        <div className={`text-xs ${subTextClasses} mt-0.5`}>
                                          {component.subCategory && `${component.subCategory.category.nom} > ${component.subCategory.nom} • `}
                                          Grade: {component.grade} • {component.poidsUnitaire || component.poids}kg/u
                                        </div>
                                      </div>
                                    </div>
                                    <ChevronRight className={`w-4 h-4 ${subTextClasses}`} />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className={`text-center py-8 ${subTextClasses} text-sm`}>
                                Aucun composant dans ce lot
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );};

  const AnalyticsTab = () => {
    if (!selectedCaseFileDetails) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className={`text-sm ${subTextClasses}`}>Sélectionnez un dossier pour voir les analytics</div>
        </div>
      );
    }

    const details = selectedCaseFileDetails;
    const lotsData = details.lots || [];

    if (lotsData.length === 0) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className={`text-sm ${subTextClasses}`}>Aucune donnée analytique disponible (pas de lots)</div>
        </div>
      );
    }

    // Calculs KPIs
    const poidsReel = details.poidsReel || 0;
    const poidsEstime = details.poidsEstime || 0;
    const ecartPesee = poidsEstime > 0 ? (((poidsReel - poidsEstime) / poidsEstime) * 100).toFixed(1) : '0';

    const dateCreation = new Date(details.createdAt);
    const dateActuelle = details.closedAt ? new Date(details.closedAt) : new Date();
    const tempsCycle = Math.ceil((dateActuelle.getTime() - dateCreation.getTime()) / (1000 * 60 * 60 * 24));

    const lotsValorises = lotsData.filter((l: any) => ['resale', 'refurbishment'].includes(l.orientation)).length;
    const tauxValorisation = lotsData.length > 0 ? ((lotsValorises / lotsData.length) * 100).toFixed(1) : '0';

    return (
    <div className="space-y-6">
      {/* KPIs Analytiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-lg p-4`}>
          <div className="flex items-center justify-between mb-2">
            <div className={`text-sm ${subTextClasses}`}>Taux de Valorisation</div>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div className={`text-2xl font-bold ${headingClasses}`}>{tauxValorisation}%</div>
          <div className={`text-xs ${subTextClasses} mt-1`}>{lotsValorises} lots sur {lotsData.length}</div>
        </div>

        <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-lg p-4`}>
          <div className="flex items-center justify-between mb-2">
            <div className={`text-sm ${subTextClasses}`}>Temps de Cycle</div>
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div className={`text-2xl font-bold ${headingClasses}`}>{tempsCycle} jours</div>
          <div className={`text-xs ${subTextClasses} mt-1`}>Du {dateCreation.toLocaleDateString('fr-FR')}</div>
        </div>

        <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-lg p-4`}>
          <div className="flex items-center justify-between mb-2">
            <div className={`text-sm ${subTextClasses}`}>Écart Pesée</div>
            <Weight className="w-5 h-5 text-purple-600" />
          </div>
          <div className={`text-2xl font-bold ${
            Number(ecartPesee) > 0 ? 'text-emerald-600' : Number(ecartPesee) < 0 ? 'text-red-600' : headingClasses
          }`}>
            {Number(ecartPesee) > 0 ? '+' : ''}{ecartPesee}%
          </div>
          <div className={`text-xs ${subTextClasses} mt-1`}>Réel vs estimé</div>
        </div>

        <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-lg p-4`}>
          <div className="flex items-center justify-between mb-2">
            <div className={`text-sm ${subTextClasses}`}>Nombre de Lots</div>
            <Package className="w-5 h-5 text-cyan-600" />
          </div>
          <div className={`text-2xl font-bold ${headingClasses}`}>{lotsData.length}</div>
          <div className={`text-xs ${subTextClasses} mt-1`}>Lots diagnostiqués</div>
        </div>
      </div>

      {/* Graphique poids par catégorie */}
      <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-lg p-6`}>
        <h3 className={`text-lg font-semibold ${headingClasses} mb-4 flex items-center`}>
          <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
          Répartition du Poids par Catégorie
        </h3>
        <div className="space-y-3">
          {(() => {
            // Calculer la répartition des poids par catégorie
            const categoryWeights: { [key: string]: number } = {};
            let totalWeight = 0;

            lotsData.forEach((lot: any) => {
              const weight = lot.poidsReel || lot.poidsEstime || 0;
              const category = lot.categorieName || 'Autres';
              categoryWeights[category] = (categoryWeights[category] || 0) + weight;
              totalWeight += weight;
            });

            const colors = ['bg-blue-500', 'bg-purple-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-orange-500', 'bg-pink-500'];
            let colorIndex = 0;

            return Object.entries(categoryWeights)
              .sort(([, a], [, b]) => b - a) // Trier par poids décroissant
              .map(([category, weight], index) => {
                const percentage = totalWeight > 0 ? ((weight / totalWeight) * 100).toFixed(1) : '0';
                const color = colors[colorIndex % colors.length];
                colorIndex++;

                return (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm ${text('text-slate-300', 'text-gray-700')}`}>{category}</span>
                      <span className={`text-sm ${headingClasses} font-medium`}>{(weight / 1000).toFixed(2)} kg ({percentage}%)</span>
                    </div>
                    <div className={`w-full ${bg('bg-slate-700', 'bg-gray-300')} rounded-full h-2`}>
                      <div
                        className={`${color} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              });
          })()}
        </div>
      </div>

      {/* Répartition par grade et orientation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-lg p-6`}>
          <h3 className={`text-lg font-semibold ${headingClasses} mb-4`}>Répartition par Grade</h3>
          <div className="space-y-3">
            {(() => {
              // Calculer la répartition par grade
              const gradeCount: { [key: string]: number } = {};
              lotsData.forEach((lot: any) => {
                const grade = lot.grade || 'N/A';
                gradeCount[grade] = (gradeCount[grade] || 0) + 1;
              });

              const gradeColors: { [key: string]: string } = {
                'A': 'bg-emerald-500',
                'B': 'bg-blue-500',
                'C': 'bg-orange-500',
                'D': 'bg-red-500',
                'N/A': 'bg-gray-500'
              };

              return Object.entries(gradeCount)
                .sort(([a], [b]) => a.localeCompare(b)) // Trier alphabétiquement
                .map(([grade, count], index) => {
                  const percentage = lotsData.length > 0 ? ((count / lotsData.length) * 100).toFixed(1) : '0';
                  const color = gradeColors[grade] || 'bg-gray-500';

                  return (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium mr-2 ${getGradeColor(grade)}`}>
                            Grade {grade}
                          </span>
                          <span className={`text-sm ${subTextClasses}`}>{count} lots</span>
                        </div>
                        <span className={`text-sm ${headingClasses} font-medium`}>{percentage}%</span>
                      </div>
                      <div className={`w-full ${bg('bg-slate-700', 'bg-gray-300')} rounded-full h-2`}>
                        <div
                          className={`${color} h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                });
            })()}
          </div>
        </div>

        <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-lg p-6`}>
          <h3 className={`text-lg font-semibold ${headingClasses} mb-4`}>Répartition par Orientation</h3>
          <div className="space-y-3">
            {(() => {
              // Calculer la répartition par orientation
              const orientationCount: { [key: string]: number } = {};
              lotsData.forEach((lot: any) => {
                const orientation = lot.orientation || 'N/A';
                orientationCount[orientation] = (orientationCount[orientation] || 0) + 1;
              });

              const orientationLabels: { [key: string]: string } = {
                'resale': 'Revente',
                'refurbishment': 'Reconditionnement',
                'dismantling': 'Démantèlement',
                'waste': 'Déchet',
                'N/A': 'Non défini'
              };

              const orientationColors: { [key: string]: string } = {
                'resale': 'bg-emerald-500',
                'refurbishment': 'bg-blue-500',
                'dismantling': 'bg-purple-500',
                'waste': 'bg-red-500',
                'N/A': 'bg-gray-500'
              };

              return Object.entries(orientationCount)
                .sort(([, a], [, b]) => b - a) // Trier par nombre décroissant
                .map(([orientation, count], index) => {
                  const percentage = lotsData.length > 0 ? ((count / lotsData.length) * 100).toFixed(1) : '0';
                  const label = orientationLabels[orientation] || orientation;
                  const color = orientationColors[orientation] || 'bg-gray-500';

                  return (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <span className={`text-sm ${text('text-slate-300', 'text-gray-700')}`}>{label}</span>
                          <span className={`text-xs ${subTextClasses} ml-2`}>({count} lots)</span>
                        </div>
                        <span className={`text-sm ${headingClasses} font-medium`}>{percentage}%</span>
                      </div>
                      <div className={`w-full ${bg('bg-slate-700', 'bg-gray-300')} rounded-full h-2`}>
                        <div
                          className={`${color} h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                });
            })()}
          </div>
        </div>
      </div>

      {/* Comparaison temporelle */}
      <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-lg p-6`}>
        <h3 className={`text-lg font-semibold ${headingClasses} mb-4`}>Comparaison Temporelle</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`${bg('bg-slate-900', 'bg-gray-50')} ${cardBorderClasses} border rounded-lg p-4`}>
            <div className={`text-sm ${subTextClasses} mb-2`}>Ce dossier</div>
            <div className={`text-2xl font-bold ${headingClasses}`}>
              {(() => {
                const poids = poidsReel > 0 ? poidsReel : poidsEstime;
                const poidsEnTonnes = (poids / 1000000).toFixed(2);
                return `${poidsEnTonnes} T`;
              })()}
            </div>
            <div className={`text-xs ${subTextClasses} mt-1`}>Poids {poidsReel > 0 ? 'réel' : 'estimé'}</div>
          </div>
          <div className={`${bg('bg-slate-900', 'bg-gray-50')} ${cardBorderClasses} border rounded-lg p-4`}>
            <div className={`text-sm ${subTextClasses} mb-2`}>Nombre de lots</div>
            <div className={`text-2xl font-bold ${headingClasses}`}>{lotsData.length}</div>
            <div className={`text-xs ${subTextClasses} mt-1`}>Lots diagnostiqués</div>
          </div>
          <div className={`${bg('bg-slate-900', 'bg-gray-50')} ${cardBorderClasses} border rounded-lg p-4`}>
            <div className={`text-sm ${subTextClasses} mb-2`}>Valeur totale</div>
            <div className={`text-2xl font-bold ${headingClasses}`}>
              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(details.valeurTotale || 0)}
            </div>
            <div className={`text-xs ${subTextClasses} mt-1`}>Estimation</div>
          </div>
        </div>
      </div>
    </div>
  );
  };

  const MediasTab = () => {
    const [isUploading, setIsUploading] = React.useState(false);
    const [uploadProgress, setUploadProgress] = React.useState(0);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    if (!selectedCaseFileDetails) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className={`text-sm ${subTextClasses}`}>Sélectionnez un dossier pour voir les médias</div>
        </div>
      );
    }

    const details = selectedCaseFileDetails;
    const documents = details.documents || [];

    // Filter documents by type
    const photos = documents.filter((d: any) => d.type === 'photo' || d.type === 'image');
    const internalDocs = documents.filter((d: any) =>
      ['bon_pesée', 'bon_livraison', 'bon_enlevement', 'bon_sortie', 'rapport', 'bordereau', 'certificat'].includes(d.type.toLowerCase())
    );
    const clientDocs = documents.filter((d: any) =>
      ['devis', 'facture', 'contrat'].includes(d.type.toLowerCase())
    );

    // Fonction pour gérer l'upload de fichiers
    const handleFileUpload = async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      setIsUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('file', files[0]);

      try {
        const response = await fetch(`https://valotik-api-546691893264.europe-west1.run.app/api/case-files/${selectedCaseFile}/documents`, {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (result.success) {
          // Recharger les détails du dossier pour afficher le nouveau document
          await loadCaseFileDetails(selectedCaseFile);
          setUploadProgress(100);
          setTimeout(() => {
            setIsUploading(false);
            setUploadProgress(0);
          }, 1000);
        } else {
          console.error('Erreur upload:', result.error);
          setIsUploading(false);
        }
      } catch (error) {
        console.error('Erreur lors de l\'upload:', error);
        setIsUploading(false);
      }
    };

    // Fonction pour visualiser un document
    const handleViewDocument = (doc: any) => {
      window.open(`https://valotik-api-546691893264.europe-west1.run.app${doc.url}`, '_blank');
    };

    // Fonction pour télécharger un document
    const handleDownloadDocument = (doc: any) => {
      const link = document.createElement('a');
      link.href = `https://valotik-api-546691893264.europe-west1.run.app${doc.url}`;
      link.download = doc.nomFichier;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    // Fonction pour supprimer un document
    const handleDeleteDocument = async (docId: string) => {
      if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return;

      try {
        const response = await fetch(`https://valotik-api-546691893264.europe-west1.run.app/api/documents/${docId}`, {
          method: 'DELETE',
        });

        const result = await response.json();

        if (result.success) {
          // Recharger les détails du dossier
          await loadCaseFileDetails(selectedCaseFile);
        }
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    };

    // Fonction pour obtenir l'icône et la couleur selon le type de fichier
    const getFileIcon = (type: string) => {
      switch (type.toLowerCase()) {
        case 'devis':
        case 'pdf':
          return { icon: FileText, color: 'text-red-600', bgColor: bg('bg-red-500/10', 'bg-red-50'), borderColor: border('border-red-500/30', 'border-red-200') };
        case 'photo':
        case 'image':
          return { icon: FileImage, color: 'text-blue-600', bgColor: bg('bg-blue-500/10', 'bg-blue-50'), borderColor: border('border-blue-500/30', 'border-blue-200') };
        case 'bon_pesée':
        case 'certificat':
          return { icon: FileText, color: 'text-emerald-600', bgColor: bg('bg-emerald-500/10', 'bg-emerald-50'), borderColor: border('border-emerald-500/30', 'border-emerald-200') };
        default:
          return { icon: File, color: 'text-slate-400', bgColor: bg('bg-slate-500/10', 'bg-gray-50'), borderColor: border('border-slate-500/30', 'border-gray-200') };
      }
    };

    const formatFileSize = (bytes: number) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    return (
      <div className="space-y-6">
        {/* Navigation sous-onglets */}
        <div className={`flex gap-2 ${bg('bg-slate-800/50', 'bg-gray-100')} p-1 rounded-xl border ${border('border-slate-700', 'border-gray-200')}`}>
          <button
            onClick={() => setMediaSubTab('gallery')}
            className={`flex-1 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
              mediaSubTab === 'gallery'
                ? `${bg('bg-gradient-to-r from-blue-600 to-blue-500', 'bg-blue-600')} text-white shadow-lg shadow-blue-500/50`
                : isDark
                  ? 'text-slate-400 hover:text-slate-300'
                  : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Grid3x3 className="w-4 h-4" />
            Gallery ({photos.length})
          </button>
          <button
            onClick={() => setMediaSubTab('internal-docs')}
            className={`flex-1 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
              mediaSubTab === 'internal-docs'
                ? `${bg('bg-gradient-to-r from-purple-600 to-purple-500', 'bg-purple-600')} text-white shadow-lg shadow-purple-500/50`
                : isDark
                  ? 'text-slate-400 hover:text-slate-300'
                  : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            Documents Internes ({internalDocs.length})
          </button>
          <button
            onClick={() => setMediaSubTab('client-docs')}
            className={`flex-1 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
              mediaSubTab === 'client-docs'
                ? `${bg('bg-gradient-to-r from-emerald-600 to-emerald-500', 'bg-emerald-600')} text-white shadow-lg shadow-emerald-500/50`
                : isDark
                  ? 'text-slate-400 hover:text-slate-300'
                  : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Documents Clients ({clientDocs.length})
          </button>
          <button
            onClick={() => setMediaSubTab('auto-generation')}
            className={`flex-1 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
              mediaSubTab === 'auto-generation'
                ? `${bg('bg-gradient-to-r from-purple-600 to-purple-500', 'bg-purple-600')} text-white shadow-lg shadow-purple-500/50`
                : isDark
                  ? 'text-slate-400 hover:text-slate-300'
                  : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            Génération automatique
          </button>
        </div>

        {/* Contenu selon le sous-onglet actif */}
        {mediaSubTab === 'gallery' && (
          <div className="space-y-6">
            {/* Header Gallery */}
            <div className="flex items-center justify-between">
              <h3 className={`text-lg font-semibold ${headingClasses} flex items-center`}>
                <Image className="w-5 h-5 mr-2 text-blue-600" />
                Gallery Pinterest - {photos.length} photos
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsAIRecognitionOpen(true)}
                  className={`px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50`}
                >
                  <Sparkles className="w-4 h-4" />
                  AI Recognition
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Ajouter des photos
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                multiple
                onChange={(e) => handleFileUpload(e.target.files)}
              />
            </div>

            {/* Gallery Pinterest/Masonry */}
            {photos.length > 0 ? (
              <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
                {photos.map((photo: any) => (
                  <div
                    key={photo.id}
                    className={`break-inside-avoid ${bg('bg-slate-900', 'bg-white')} ${border('border-slate-800', 'border-gray-200')} border rounded-xl overflow-hidden group hover:shadow-xl transition-all duration-300 cursor-pointer`}
                  >
                    <div className="relative overflow-hidden">
                      <img
                        src={photo.url.startsWith('http') ? photo.url : `https://valotik-api-546691893264.europe-west1.run.app${photo.url}`}
                        alt={photo.nomFichier}
                        className="w-full h-auto object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <p className="text-white font-medium text-sm truncate">{photo.nomFichier}</p>
                          <p className="text-white/80 text-xs mt-1">{formatDate(photo.createdAt)}</p>
                        </div>
                        {/* Actions en overlay */}
                        <div className="absolute top-3 right-3 flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const imageUrl = photo.url.startsWith('http') ? photo.url : `https://valotik-api-546691893264.europe-west1.run.app${photo.url}`;
                              openAIRecognitionWithImage(imageUrl);
                            }}
                            className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 backdrop-blur-sm hover:from-purple-600 hover:to-indigo-600 rounded-lg transition-all shadow-lg shadow-purple-500/30"
                            title="Analyser avec IA"
                          >
                            <Sparkles className="w-4 h-4 text-white" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDocument(photo);
                            }}
                            className="p-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-lg transition-colors"
                            title="Voir en grand"
                          >
                            <Eye className="w-4 h-4 text-white" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadDocument(photo);
                            }}
                            className="p-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-lg transition-colors"
                            title="Télécharger"
                          >
                            <Download className="w-4 h-4 text-white" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDocument(photo.id);
                            }}
                            className="p-2 bg-red-500/80 backdrop-blur-sm hover:bg-red-600 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      </div>
                    </div>
                    {/* Info card en bas */}
                    <div className="p-3">
                      <div className={`text-xs ${subTextClasses} flex items-center justify-between`}>
                        <span>{photo.taille ? formatFileSize(photo.taille) : 'N/A'}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${bg('bg-blue-500/10', 'bg-blue-50')} text-blue-600`}>
                          Photo
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <Image className={`w-20 h-20 mx-auto mb-4 ${mutedTextClasses} opacity-20`} />
                <p className={`${headingClasses} font-medium mb-2`}>Aucune photo dans ce dossier</p>
                <p className={`text-sm ${subTextClasses} mb-6`}>Ajoutez des photos pour créer votre galerie</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  Ajouter des photos
                </button>
              </div>
            )}
          </div>
        )}

        {mediaSubTab === 'internal-docs' && (
          <div className="space-y-6">
            {/* Statistiques en haut */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-lg p-4`}>
            <div className="flex items-center justify-between mb-2">
              <div className={`text-sm ${subTextClasses}`}>Total documents</div>
              <File className="w-5 h-5 text-slate-400" />
            </div>
            <div className={`text-2xl font-bold ${headingClasses}`}>{documents.length}</div>
          </div>

          <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-lg p-4`}>
            <div className="flex items-center justify-between mb-2">
              <div className={`text-sm ${subTextClasses}`}>Photos</div>
              <FileImage className="w-5 h-5 text-blue-600" />
            </div>
            <div className={`text-2xl font-bold ${headingClasses}`}>{photos.length}</div>
          </div>

          <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-lg p-4`}>
            <div className="flex items-center justify-between mb-2">
              <div className={`text-sm ${subTextClasses}`}>Docs Internes</div>
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <div className={`text-2xl font-bold ${headingClasses}`}>{internalDocs.length}</div>
          </div>

          <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-lg p-4`}>
            <div className="flex items-center justify-between mb-2">
              <div className={`text-sm ${subTextClasses}`}>Docs Clients</div>
              <FileText className="w-5 h-5 text-emerald-600" />
            </div>
            <div className={`text-2xl font-bold ${headingClasses}`}>{clientDocs.length}</div>
          </div>
        </div>

        {/* Layout 2 colonnes: Upload à gauche, Liste à droite */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Zone d'upload - Gauche */}
          <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-lg p-6`}>
            <h3 className={`text-lg font-semibold ${headingClasses} mb-4 flex items-center`}>
              <Upload className="w-5 h-5 mr-2 text-blue-600" />
              Ajouter des documents
            </h3>
            <div
              className={`border-2 border-dashed ${border('border-slate-600', 'border-gray-300')} rounded-lg p-8 text-center ${bg('hover:bg-slate-800/50', 'hover:bg-gray-50')} transition-colors cursor-pointer`}
              onDragOver={(e) => { e.preventDefault(); }}
              onDrop={(e) => {
                e.preventDefault();
                handleFileUpload(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx"
                onChange={(e) => handleFileUpload(e.target.files)}
              />
              {isUploading ? (
                <>
                  <div className="w-12 h-12 mx-auto mb-4 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className={`${headingClasses} font-medium mb-2`}>Upload en cours...</p>
                  <div className="w-full max-w-xs mx-auto bg-slate-700 rounded-full h-2 mt-4">
                    <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                </>
              ) : (
                <>
                  <Upload className={`w-12 h-12 mx-auto mb-4 ${subTextClasses}`} />
                  <p className={`${headingClasses} font-medium mb-2`}>Glissez-déposez vos fichiers ici</p>
                  <p className={`text-sm ${subTextClasses} mb-4`}>ou cliquez pour parcourir</p>
                  <button
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    Parcourir les fichiers
                  </button>
                  <p className={`text-xs ${subTextClasses} mt-4`}>
                    PDF, Images (JPG, PNG), Documents (DOC, XLS) - Max 10 MB par fichier
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Liste des documents - Droite */}
          <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-lg p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold ${headingClasses} flex items-center`}>
              <File className="w-5 h-5 mr-2 text-purple-600" />
              Documents ({documents.length})
            </h3>
            <div className="flex items-center gap-2">
              <select className={`custom-select px-3 py-1.5 ${bg('bg-slate-800', 'bg-gray-100')} ${border('border-slate-700', 'border-gray-300')} border ${text('text-white', 'text-gray-900')} rounded-lg text-sm`}>
                <option value="all">Tous les types</option>
                <option value="devis">Devis</option>
                <option value="photo">Photos</option>
                <option value="bon_pesée">Bons de pesée</option>
                <option value="certificat">Certificats</option>
              </select>
            </div>
          </div>

          {documents.length > 0 ? (
            <div className="space-y-3">
              {documents.map((doc: any) => {
                const fileInfo = getFileIcon(doc.type);
                const FileIcon = fileInfo.icon;

                return (
                  <div
                    key={doc.id}
                    className={`flex items-center justify-between p-4 ${fileInfo.bgColor} border ${fileInfo.borderColor} rounded-lg ${bg('hover:bg-slate-700/30', 'hover:bg-gray-100')} transition-colors`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {/* Icône du fichier */}
                      <div className={`w-12 h-12 rounded-lg ${bg('bg-slate-800', 'bg-white')} ${border('border-slate-700', 'border-gray-200')} border flex items-center justify-center flex-shrink-0`}>
                        <FileIcon className={`w-6 h-6 ${fileInfo.color}`} />
                      </div>

                      {/* Informations du fichier */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`font-medium ${headingClasses} truncate`}>{doc.nomFichier}</h4>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${fileInfo.bgColor} ${fileInfo.color}`}>
                            {doc.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <span className={subTextClasses}>
                            {doc.taille ? formatFileSize(doc.taille) : 'N/A'}
                          </span>
                          <span className={subTextClasses}>•</span>
                          <span className={subTextClasses}>
                            {formatDate(doc.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewDocument(doc)}
                        className={`p-2 ${bg('bg-slate-700', 'bg-gray-200')} ${bg('hover:bg-slate-600', 'hover:bg-gray-300')} rounded-lg transition-colors`}
                        title="Voir"
                      >
                        <Eye className={`w-4 h-4 ${text('text-slate-300', 'text-gray-700')}`} />
                      </button>
                      <button
                        onClick={() => handleDownloadDocument(doc)}
                        className={`p-2 ${bg('bg-slate-700', 'bg-gray-200')} ${bg('hover:bg-slate-600', 'hover:bg-gray-300')} rounded-lg transition-colors`}
                        title="Télécharger"
                      >
                        <Download className={`w-4 h-4 ${text('text-slate-300', 'text-gray-700')}`} />
                      </button>
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className={`p-2 ${bg('bg-red-500/10', 'bg-red-50')} ${bg('hover:bg-red-500/20', 'hover:bg-red-100')} rounded-lg transition-colors`}
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <File className={`w-16 h-16 mx-auto mb-4 opacity-20 ${subTextClasses}`} />
              <p className={`${headingClasses} font-medium mb-2`}>Aucun document</p>
              <p className={`text-sm ${subTextClasses}`}>Ajoutez des documents en utilisant la zone d'upload ci-dessus</p>
            </div>
          )}
          </div>
        </div>

            {/* Documents PDF Générés Automatiquement */}
            <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-lg p-6 shadow-lg transition-all duration-300 hover:shadow-cyan-500/10`}>
              <h3 className={`text-lg font-semibold ${headingClasses} mb-4 flex items-center`}>
                <FileText className="w-5 h-5 mr-2 text-cyan-600 animate-pulse" />
                Documents PDF Officiels
              </h3>
              {(() => {
                const quotation = details.quotation;
                const pdfDocuments = [];

                if (quotation?.statut === 'approved') {
                  pdfDocuments.push({
                    id: 'bon-commande',
                    type: 'Bon de commande',
                    name: `BC_${details.reference}.pdf`,
                    date: quotation.createdAt,
                    icon: FileSpreadsheet,
                    color: 'text-emerald-600',
                    bgColor: bg('bg-emerald-500/10', 'bg-emerald-50'),
                    borderColor: border('border-emerald-500/30', 'border-emerald-200'),
                    size: '245 Ko',
                    description: 'Document contractuel validé'
                  });
                }

                if (details.diagnosis) {
                  pdfDocuments.push({
                    id: 'rapport-diagnostic',
                    type: 'Rapport de diagnostic',
                    name: `DIAG_${details.reference}.pdf`,
                    date: details.diagnosis.dateVisite,
                    icon: Clipboard,
                    color: 'text-blue-600',
                    bgColor: bg('bg-blue-500/10', 'bg-blue-50'),
                    borderColor: border('border-blue-500/30', 'border-blue-200'),
                    size: '1.2 Mo',
                    description: `${(details.lots || []).length} lots identifiés`
                  });
                }

                if (details.statut !== 'diagnostic_pending' && details.statut !== 'quotation_pending') {
                  pdfDocuments.push({
                    id: 'bon-livraison',
                    type: 'Bon de livraison',
                    name: `BL_${details.reference}.pdf`,
                    date: details.request?.plannedVisitAt || details.updatedAt,
                    icon: Truck,
                    color: 'text-orange-600',
                    bgColor: bg('bg-orange-500/10', 'bg-orange-50'),
                    borderColor: border('border-orange-500/30', 'border-orange-200'),
                    size: '180 Ko',
                    description: 'Preuve de collecte'
                  });
                }

                if (details.closedAt) {
                  pdfDocuments.push({
                    id: 'certificat-tracabilite',
                    type: 'Certificat de traçabilité',
                    name: `CERT_${details.reference}.pdf`,
                    date: details.closedAt,
                    icon: CheckCircle2,
                    color: 'text-purple-600',
                    bgColor: bg('bg-purple-500/10', 'bg-purple-50'),
                    borderColor: border('border-purple-500/30', 'border-purple-200'),
                    size: '520 Ko',
                    description: 'Traçabilité complète DEEE'
                  });
                }

                if (quotation) {
                  pdfDocuments.push({
                    id: 'devis',
                    type: 'Devis',
                    name: `DEVIS_${details.reference}.pdf`,
                    date: quotation.createdAt,
                    icon: FileSpreadsheet,
                    color: quotation.statut === 'approved' ? 'text-emerald-600' : 'text-yellow-600',
                    bgColor: quotation.statut === 'approved'
                      ? bg('bg-emerald-500/10', 'bg-emerald-50')
                      : bg('bg-yellow-500/10', 'bg-yellow-50'),
                    borderColor: quotation.statut === 'approved'
                      ? border('border-emerald-500/30', 'border-emerald-200')
                      : border('border-yellow-500/30', 'border-yellow-200'),
                    size: '320 Ko',
                    description: quotation.statut === 'approved' ? 'Validé' : 'En attente de validation'
                  });
                }

                if (pdfDocuments.length === 0) {
                  return (
                    <div className="text-center py-12">
                      <FileText className={`w-16 h-16 mx-auto mb-4 ${mutedTextClasses} opacity-20`} />
                      <p className={`text-sm ${subTextClasses}`}>Aucun document PDF officiel disponible</p>
                      <p className={`text-xs ${mutedTextClasses} mt-2`}>Les documents seront générés au fur et à mesure du traitement du dossier</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {pdfDocuments.map((doc) => {
                      const DocIcon = doc.icon;
                      return (
                        <div
                          key={doc.id}
                          className={`${doc.bgColor} border ${doc.borderColor} rounded-lg p-4 transition-all duration-300 hover:scale-105 hover:shadow-lg group`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg ${bg('bg-slate-700', 'bg-white')} flex items-center justify-center`}>
                                <DocIcon className={`w-5 h-5 ${doc.color}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className={`text-xs font-medium ${doc.color} uppercase tracking-wide`}>{doc.type}</div>
                                <div className={`text-xs ${mutedTextClasses} mt-0.5`}>{formatDate(doc.date)}</div>
                              </div>
                            </div>
                          </div>
                          <div className={`text-sm font-semibold ${headingClasses} mb-1 truncate`}>{doc.name}</div>
                          <div className={`text-xs ${subTextClasses} mb-3`}>{doc.description}</div>
                          <div className="flex items-center justify-between pt-3 border-t border-slate-700/30">
                            <span className={`text-xs ${mutedTextClasses}`}>{doc.size}</span>
                            <div className="flex items-center gap-2">
                              <button
                                className={`p-1.5 rounded-lg ${bg('bg-slate-700/50', 'bg-gray-100')} ${text('text-slate-300', 'text-gray-700')} transition-all duration-200 hover:scale-110 ${text('hover:text-cyan-600', 'hover:text-cyan-600')}`}
                                title="Aperçu"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                className={`p-1.5 rounded-lg ${bg('bg-slate-700/50', 'bg-gray-100')} ${text('text-slate-300', 'text-gray-700')} transition-all duration-200 hover:scale-110 ${text('hover:text-emerald-600', 'hover:text-emerald-600')}`}
                                title="Télécharger"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {mediaSubTab === 'auto-generation' && (
          <div className="space-y-6">
            <h3 className={`text-lg font-semibold ${headingClasses} flex items-center`}>
              <FileText className="w-5 h-5 mr-2 text-purple-600" />
              Génération automatique de documents
            </h3>
            <D3EDocGenerator />
          </div>
        )}

        {mediaSubTab === 'client-docs' && (
          <div className="space-y-6">
            <h3 className={`text-lg font-semibold ${headingClasses} flex items-center`}>
              <UserCheck className="w-5 h-5 mr-2 text-emerald-600" />
              Documents Clients - {clientDocs.length} documents
            </h3>
            {clientDocs.length > 0 ? (
              <div className="space-y-3">
                {clientDocs.map((doc: any) => {
                  const fileInfo = getFileIcon(doc.type);
                  const FileIcon = fileInfo.icon;
                  return (
                    <div
                      key={doc.id}
                      className={`flex items-center justify-between p-4 ${fileInfo.bgColor} border ${fileInfo.borderColor} rounded-lg ${bg('hover:bg-slate-700/30', 'hover:bg-gray-100')} transition-colors`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-12 h-12 rounded-lg ${bg('bg-slate-800', 'bg-white')} ${border('border-slate-700', 'border-gray-200')} border flex items-center justify-center flex-shrink-0`}>
                          <FileIcon className={`w-6 h-6 ${fileInfo.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`font-medium ${headingClasses} truncate`}>{doc.nomFichier}</h4>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${fileInfo.bgColor} ${fileInfo.color}`}>
                              {doc.type}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs">
                            <span className={subTextClasses}>{doc.taille ? formatFileSize(doc.taille) : 'N/A'}</span>
                            <span className={subTextClasses}>•</span>
                            <span className={subTextClasses}>{formatDate(doc.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDocument(doc)}
                          className={`p-2 ${bg('bg-slate-700', 'bg-gray-200')} ${bg('hover:bg-slate-600', 'hover:bg-gray-300')} rounded-lg transition-colors`}
                          title="Voir"
                        >
                          <Eye className={`w-4 h-4 ${text('text-slate-300', 'text-gray-700')}`} />
                        </button>
                        <button
                          onClick={() => handleDownloadDocument(doc)}
                          className={`p-2 ${bg('bg-slate-700', 'bg-gray-200')} ${bg('hover:bg-slate-600', 'hover:bg-gray-300')} rounded-lg transition-colors`}
                          title="Télécharger"
                        >
                          <Download className={`w-4 h-4 ${text('text-slate-300', 'text-gray-700')}`} />
                        </button>
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className={`p-2 ${bg('bg-red-500/10', 'bg-red-50')} ${bg('hover:bg-red-500/20', 'hover:bg-red-100')} rounded-lg transition-colors`}
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20">
                <FileText className={`w-20 h-20 mx-auto mb-4 ${mutedTextClasses} opacity-20`} />
                <p className={`${headingClasses} font-medium mb-2`}>Aucun document client</p>
                <p className={`text-sm ${subTextClasses}`}>Les documents clients (devis, factures, contrats) apparaîtront ici</p>
              </div>
            )}
          </div>
        )}

        {/* AI Recognition Panel - Slide from right */}
        {isAIRecognitionOpen && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fadeIn"
              onClick={() => setIsAIRecognitionOpen(false)}
              style={{
                animation: 'fadeIn 0.3s ease-out'
              }}
            ></div>

            {/* Panel */}
            <div
              className={`fixed right-0 top-0 h-screen w-[70%] ${bg('bg-slate-900', 'bg-white')} ${border('border-slate-800', 'border-gray-200')} border-l z-50 overflow-y-auto shadow-2xl animate-slideInRight`}
              style={{
                animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              {/* Header du panneau */}
              <div className={`sticky top-0 ${bg('bg-slate-900/95 backdrop-blur-lg', 'bg-white/95 backdrop-blur-lg')} ${border('border-slate-800', 'border-gray-200')} border-b p-6 z-10`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg shadow-purple-500/30">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className={`text-2xl font-bold ${headingClasses} flex items-center gap-2`}>
                        AI Recognition
                        <span className="px-2 py-1 text-xs bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full font-medium shadow-lg shadow-purple-500/30">
                          GPT-4 Vision
                        </span>
                      </h2>
                      <p className={`text-sm ${subTextClasses} mt-1`}>
                        Analyse automatique de matériel D3E par intelligence artificielle
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsAIRecognitionOpen(false)}
                    className={`p-2 ${bg('hover:bg-slate-800', 'hover:bg-gray-100')} rounded-lg transition-colors`}
                  >
                    <X className={`w-5 h-5 ${subTextClasses}`} />
                  </button>
                </div>
                {/* Status badge */}
                <div className="flex items-center gap-2 mt-4 flex-wrap">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                    aiConfigured
                      ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30'
                      : 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${aiConfigured ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`}></div>
                    <span className={`text-xs font-medium ${aiConfigured ? 'text-green-500' : 'text-yellow-500'}`}>
                      {aiConfigured ? 'API Configurée' : 'Configuration requise'}
                    </span>
                  </div>
                  {aiConfigured && (
                    <>
                      <div className={`px-3 py-1.5 rounded-lg ${bg('bg-purple-500/10', 'bg-purple-50')} border ${border('border-purple-500/20', 'border-purple-200')}`}>
                        <span className="text-xs font-medium text-purple-600">Modèle: {aiModel}</span>
                      </div>
                      <button
                        onClick={() => setAiConfigured(false)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${bg('bg-blue-500/10 hover:bg-blue-500/20', 'bg-blue-50 hover:bg-blue-100')} border ${border('border-blue-500/20', 'border-blue-200')} transition-all`}
                        title="Modifier la configuration API"
                      >
                        <Settings className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-xs font-medium text-blue-600">Modifier</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Configuration Section */}
                {!aiConfigured && (
                  <div className="relative overflow-hidden">
                    {/* Neon glow effect */}
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-yellow-500/20 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl"></div>

                    <div className={`relative ${bg('bg-gradient-to-br from-yellow-500/10 via-orange-500/5 to-yellow-500/10', 'bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-50')} border-2 ${border('border-yellow-500/30', 'border-yellow-300')} rounded-2xl p-6 backdrop-blur-sm shadow-xl`}>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl shadow-lg shadow-yellow-500/30">
                          <Key className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className={`font-bold text-xl ${headingClasses}`}>Configuration API</h3>
                          <p className={`text-xs ${subTextClasses}`}>Connectez votre clé OpenAI pour démarrer</p>
                        </div>
                      </div>

                      <div className="space-y-5">
                        <div>
                          <label className={`block text-sm font-semibold mb-2 ${headingClasses} flex items-center gap-2`}>
                            <span className="w-1 h-4 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full"></span>
                            Clé API OpenAI
                          </label>
                          <input
                            type="password"
                            value={aiApiKey}
                            onChange={(e) => setAiApiKey(e.target.value)}
                            placeholder="sk-proj-..."
                            className={`w-full px-4 py-3 ${bg('bg-slate-800/80', 'bg-white')} ${border('border-purple-500/30', 'border-purple-300')} border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${text('text-slate-200', 'text-gray-900')} transition-all shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20`}
                          />
                        </div>

                        <div>
                          <label className={`block text-sm font-semibold mb-2 ${headingClasses} flex items-center gap-2`}>
                            <span className="w-1 h-4 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></span>
                            Modèle GPT
                          </label>
                          <select
                            value={aiModel}
                            onChange={(e) => setAiModel(e.target.value)}
                            className={`w-full px-4 py-3 ${bg('bg-slate-800/80', 'bg-white')} ${border('border-indigo-500/30', 'border-indigo-300')} border-2 rounded-xl ${text('text-slate-200', 'text-gray-900')} focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20`}
                          >
                            <option value="gpt-4o-mini">GPT-4o Mini - Rapide & Économique</option>
                            <option value="gpt-4o">GPT-4o - Plus précis</option>
                            <option value="gpt-4-turbo">GPT-4 Turbo - Performance maximale</option>
                          </select>
                        </div>

                        <button
                          onClick={saveAIConfig}
                          className="w-full bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 hover:from-green-700 hover:via-emerald-700 hover:to-green-700 text-white py-4 rounded-xl font-bold transition-all shadow-xl shadow-green-500/30 hover:shadow-green-500/50 transform hover:scale-[1.02] flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          Enregistrer la configuration
                        </button>

                        <div className={`${bg('bg-blue-500/10', 'bg-blue-50')} border ${border('border-blue-500/20', 'border-blue-200')} rounded-xl p-4`}>
                          <p className={`text-xs ${text('text-blue-400', 'text-blue-600')} flex items-start gap-2`}>
                            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span>Votre clé API est stockée de manière sécurisée dans votre navigateur et n'est jamais transmise à nos serveurs. Elle est uniquement utilisée pour communiquer directement avec OpenAI.</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Image Selection / Upload */}
                {aiConfigured && (
                  <div className="space-y-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg shadow-lg shadow-purple-500/30">
                        <Image className="w-5 h-5 text-white" />
                      </div>
                      <h3 className={`font-bold text-xl ${headingClasses}`}>Sélectionner une image</h3>
                    </div>

                    {selectedImageForAI ? (
                      <div className="relative overflow-hidden">
                        {/* Neon glow effect */}
                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>
                        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl"></div>

                        <div className={`relative ${bg('bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-purple-500/10', 'bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-50')} border-2 ${border('border-purple-500/30', 'border-purple-300')} rounded-2xl p-6 backdrop-blur-sm shadow-2xl shadow-purple-500/20`}>
                          <div className="relative overflow-hidden rounded-xl border-2 border-purple-500/30 shadow-xl">
                            <img
                              src={selectedImageForAI}
                              alt="Image sélectionnée"
                              className="w-full h-auto max-h-96 object-contain"
                            />
                          </div>

                          <div className="mt-6 flex gap-4">
                            <button
                              onClick={() => setSelectedImageForAI('')}
                              className={`flex-1 px-6 py-3 ${bg('bg-slate-700/50', 'bg-gray-200')} ${bg('hover:bg-slate-600/50', 'hover:bg-gray-300')} ${text('text-slate-200', 'text-gray-700')} rounded-xl font-semibold transition-all border ${border('border-slate-600', 'border-gray-300')} shadow-lg hover:shadow-xl`}
                            >
                              <Repeat className="w-4 h-4 inline mr-2" />
                              Changer l'image
                            </button>
                            <button
                              onClick={() => analyzeImageWithAI(selectedImageForAI)}
                              disabled={aiAnalyzing}
                              className="flex-1 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-700 hover:via-indigo-700 hover:to-purple-700 text-white py-3 px-6 rounded-xl font-bold transition-all shadow-2xl shadow-purple-500/40 hover:shadow-purple-500/60 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:scale-[1.02]"
                            >
                              {aiAnalyzing ? (
                                <>
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                  Analyse en cours...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-5 h-5" />
                                  Analyser avec IA
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {photos.map((photo: any) => (
                          <div
                            key={photo.id}
                            onClick={() => {
                              const imageUrl = photo.url.startsWith('http') ? photo.url : `https://valotik-api-546691893264.europe-west1.run.app${photo.url}`;
                              setSelectedImageForAI(imageUrl);
                            }}
                            className={`relative overflow-hidden rounded-xl cursor-pointer group ${border('border-slate-700', 'border-gray-200')} border-2 hover:border-purple-500 transition-all shadow-lg hover:shadow-2xl hover:shadow-purple-500/30`}
                          >
                            <img
                              src={photo.url.startsWith('http') ? photo.url : `https://valotik-api-546691893264.europe-west1.run.app${photo.url}`}
                              alt={photo.nomFichier}
                              className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-purple-900/90 via-purple-900/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                              <div className="w-full">
                                <p className="text-white text-xs font-semibold truncate mb-1">{photo.nomFichier}</p>
                                <div className="flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-purple-300" />
                                  <span className="text-purple-300 text-[10px] font-medium">Cliquer pour analyser</span>
                                </div>
                              </div>
                            </div>
                            {/* Neon glow on hover */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                              <div className="absolute inset-0 bg-purple-500/10 blur-xl"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Results Section */}
                {aiResults && (
                  <div className="space-y-6 animate-fadeIn">
                    {/* Success Banner with Neon Effect */}
                    <div className="relative overflow-hidden">
                      <div className="absolute -top-10 -right-10 w-32 h-32 bg-green-500/20 rounded-full blur-3xl"></div>
                      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl"></div>

                      <div className={`relative ${bg('bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-green-500/20', 'bg-gradient-to-r from-green-50 via-emerald-50 to-green-50')} border-2 ${border('border-green-500/30', 'border-green-300')} rounded-2xl p-5 backdrop-blur-sm shadow-xl shadow-green-500/20`}>
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg shadow-green-500/30">
                            <CheckCircle2 className="w-7 h-7 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className={`font-bold text-lg ${text('text-green-400', 'text-green-800')}`}>Analyse terminée avec succès !</p>
                            <p className={`text-sm ${text('text-green-500', 'text-green-600')} flex items-center gap-2`}>
                              <Sparkles className="w-4 h-4" />
                              Analysé par {aiModel}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Category & Subcategory Cards with Neon */}
                    <div className="grid md:grid-cols-2 gap-5">
                      <div className="relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl group-hover:blur-3xl transition-all"></div>
                        <div className={`relative bg-gradient-to-br ${bg('from-purple-500/20 to-purple-600/10', 'from-purple-50 to-purple-100')} rounded-2xl p-5 border-2 ${border('border-purple-500/30', 'border-purple-300')} shadow-xl shadow-purple-500/20 hover:shadow-purple-500/40 transition-all`}>
                          <div className="flex items-center gap-2 mb-3">
                            <Package className="w-5 h-5 text-purple-600" />
                            <p className={`text-sm font-bold ${text('text-purple-400', 'text-purple-900')}`}>Catégorie</p>
                          </div>
                          <p className={`text-xl font-bold ${text('text-purple-300', 'text-purple-800')}`}>
                            {aiResults.category === 'informatique' ? 'Matériel Informatique' :
                             aiResults.category === 'electrique' ? 'Matériel Électrique' :
                             aiResults.category === 'mobilier' ? 'Mobilier de Bureau' :
                             aiResults.category}
                          </p>
                        </div>
                      </div>

                      <div className="relative overflow-hidden group">
                        <div className="absolute -top-10 -left-10 w-24 h-24 bg-pink-500/20 rounded-full blur-2xl group-hover:blur-3xl transition-all"></div>
                        <div className={`relative bg-gradient-to-br ${bg('from-pink-500/20 to-pink-600/10', 'from-pink-50 to-pink-100')} rounded-2xl p-5 border-2 ${border('border-pink-500/30', 'border-pink-300')} shadow-xl shadow-pink-500/20 hover:shadow-pink-500/40 transition-all`}>
                          <div className="flex items-center gap-2 mb-3">
                            <FileText className="w-5 h-5 text-pink-600" />
                            <p className={`text-sm font-bold ${text('text-pink-400', 'text-pink-900')}`}>Sous-catégorie</p>
                          </div>
                          <p className={`text-xl font-bold ${text('text-pink-300', 'text-pink-800')}`}>{aiResults.subcategory}</p>
                        </div>
                      </div>
                    </div>

                    {/* Product Details with Neon */}
                    <div className="relative overflow-hidden">
                      <div className="absolute -top-20 right-0 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"></div>
                      <div className="absolute bottom-0 -left-20 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl"></div>

                      <div className={`relative bg-gradient-to-br ${bg('from-blue-500/10 via-indigo-500/5 to-blue-500/10', 'from-blue-50 via-indigo-50 to-blue-50')} border-2 ${border('border-blue-500/30', 'border-blue-300')} rounded-2xl p-6 backdrop-blur-sm shadow-2xl shadow-blue-500/20`}>
                        <div className="flex items-center gap-3 mb-6">
                          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg shadow-blue-500/30">
                            <Sparkles className="w-5 h-5 text-white" />
                          </div>
                          <h3 className={`text-2xl font-bold ${headingClasses}`}>{aiResults.product}</h3>
                        </div>

                        <div className="space-y-5">
                          <div>
                            <label className={`block text-sm font-bold ${headingClasses} mb-3 flex items-center gap-2`}>
                              <span className="w-1 h-4 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></span>
                              Description pour la vente
                            </label>
                            <p className={`${text('text-slate-300', 'text-gray-800')} leading-relaxed ${bg('bg-slate-800/50', 'bg-white')} p-5 rounded-xl border ${border('border-blue-500/20', 'border-blue-200')} shadow-lg`}>
                              {aiResults.description}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className={`${bg('bg-slate-800/30', 'bg-white')} p-4 rounded-xl border ${border('border-blue-500/20', 'border-blue-200')} shadow-lg hover:shadow-xl transition-all`}>
                              <p className={`text-xs font-semibold ${subTextClasses} mb-2`}>État</p>
                              <p className={`text-lg font-bold ${text('text-blue-400', 'text-blue-800')}`}>{aiResults.condition}</p>
                            </div>
                            <div className={`${bg('bg-slate-800/30', 'bg-white')} p-4 rounded-xl border ${border('border-green-500/20', 'border-green-200')} shadow-lg hover:shadow-xl transition-all`}>
                              <p className={`text-xs font-semibold ${subTextClasses} mb-2`}>Prix estimé</p>
                              <p className="text-lg font-bold text-green-600">{aiResults.estimatedPrice}</p>
                            </div>
                            {aiResults.material && (
                              <div className={`${bg('bg-slate-800/30', 'bg-white')} p-4 rounded-xl border ${border('border-amber-500/20', 'border-amber-200')} shadow-lg hover:shadow-xl transition-all`}>
                                <p className={`text-xs font-semibold ${subTextClasses} mb-2`}>Matériau</p>
                                <p className="text-lg font-bold text-amber-600">{aiResults.material}</p>
                              </div>
                            )}
                          </div>

                          {aiResults.dimensions && (
                            <div className={`${bg('bg-slate-800/30', 'bg-white')} p-4 rounded-xl border ${border('border-purple-500/20', 'border-purple-200')} shadow-lg`}>
                              <p className={`text-xs font-semibold ${subTextClasses} mb-2`}>Dimensions</p>
                              <p className={`${text('text-slate-300', 'text-gray-800')}`}>{aiResults.dimensions}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons with Neon */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button
                        onClick={() => {
                          setSelectedImageForAI('');
                          setAiResults(null);
                        }}
                        className={`${bg('bg-slate-700/50', 'bg-gray-200')} ${text('text-slate-200', 'text-gray-700')} ${bg('hover:bg-slate-600/50', 'hover:bg-gray-300')} py-4 rounded-xl font-bold transition-all border ${border('border-slate-600', 'border-gray-300')} shadow-lg hover:shadow-xl flex items-center justify-center gap-2`}
                      >
                        <Repeat className="w-5 h-5" />
                        Nouvelle analyse
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(aiResults.description);
                          alert('✅ Description copiée !');
                        }}
                        className="bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 hover:from-green-700 hover:via-emerald-700 hover:to-green-700 text-white py-4 rounded-xl font-bold transition-all shadow-xl shadow-green-500/30 hover:shadow-green-500/50 transform hover:scale-[1.02] flex items-center justify-center gap-2"
                      >
                        <Clipboard className="w-5 h-5" />
                        Copier description
                      </button>
                      <button
                        onClick={() => {
                          const blob = new Blob([JSON.stringify(aiResults, null, 2)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${aiResults.product.replace(/\s+/g, '_')}.json`;
                          a.click();
                        }}
                        className="bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 hover:from-orange-700 hover:via-red-700 hover:to-orange-700 text-white py-4 rounded-xl font-bold transition-all shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 transform hover:scale-[1.02] flex items-center justify-center gap-2"
                      >
                        <Download className="w-5 h-5" />
                        Exporter JSON
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // Rendu des onglets
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab />;
      case 'synthesis':
        return <SynthesisTab />;
      case 'request':
        return <RequestDiagnosisTab />;
      case 'quotation':
        return <QuotationTab />;
      case 'logistics':
        return <LogisticsTab />;
      case 'inventory':
        return <InventoryTab />;
      case 'analytics':
        return <AnalyticsTab />;
      case 'medias':
        return <MediasTab />;
      default:
        return <DashboardTab />;
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'synthesis', label: 'Synthèse', icon: Home },
    { id: 'request', label: 'Demande & Diagnostic', icon: Clipboard },
    { id: 'quotation', label: 'Devis', icon: FileSpreadsheet },
    { id: 'logistics', label: 'Logistique', icon: Truck },
    { id: 'inventory', label: 'Inventaire', icon: Package },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'medias', label: 'Médias', icon: FileImage },
  ];

  const currentFile = caseFiles.find((f) => f.id === selectedCaseFile);

  // Fonction de filtrage et recherche des dossiers
  const filteredCaseFiles = caseFiles.filter((file) => {
    // Filtre par statut
    const matchesStatus = filterStatus === 'all' || file.status === filterStatus;

    // Recherche dans tous les champs de la carte
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' ||
      file.reference.toLowerCase().includes(searchLower) ||
      file.client.toLowerCase().includes(searchLower) ||
      file.site.toLowerCase().includes(searchLower) ||
      getStatusLabel(file.status).toLowerCase().includes(searchLower) ||
      file.createdAt.toLowerCase().includes(searchLower) ||
      (file.collectionDate && file.collectionDate.toLowerCase().includes(searchLower));

    // Filtre par catégorie et sous-catégorie dans l'inventaire (lots)
    let matchesCategoryFilter = true;
    if (filterCategoryId || filterSubCategoryId) {
      const lots = file.inventory || [];

      if (lots.length === 0) {
        matchesCategoryFilter = false;
      } else {
        // Vérifier si au moins un component dans les lots correspond aux filtres
        matchesCategoryFilter = lots.some((lot: any) => {
          const components = lot.components || [];

          if (components.length === 0) {
            return false;
          }

          // Vérifier chaque component du lot
          return components.some((component: any) => {
            const componentCategoryId = component.subCategory?.categoryId;
            const componentSubCategoryId = component.subCategory?.id;

            // Si une catégorie est sélectionnée, vérifier qu'elle correspond
            const categoryMatches = !filterCategoryId || componentCategoryId === filterCategoryId;

            // Si une sous-catégorie est sélectionnée, vérifier qu'elle correspond
            const subCategoryMatches = !filterSubCategoryId || componentSubCategoryId === filterSubCategoryId;

            return categoryMatches && subCategoryMatches;
          });
        });
      }
    }

    return matchesStatus && matchesSearch && matchesCategoryFilter;
  });

  return (
    <>
      <style>{`
        .sidebar-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .sidebar-scroll::-webkit-scrollbar-track {
          background: ${isDark ? '#1e293b' : '#f1f5f9'};
        }
        .sidebar-scroll::-webkit-scrollbar-thumb {
          background: ${isDark ? '#475569' : '#cbd5e1'};
          border-radius: 3px;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? '#64748b' : '#94a3b8'};
        }

        /* Style personnalisé pour les selects */
        .custom-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='${isDark ? '%23cbd5e1' : '%23374151'}' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.75rem center;
          padding-right: 2.5rem;
        }
        .custom-select option {
          background: ${isDark ? '#1e293b' : '#ffffff'};
          color: ${isDark ? '#f1f5f9' : '#111827'};
          padding: 8px;
        }

        /* Animations pour le panel */
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-slideInRight {
          animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
      <div className={`min-h-screen ${bg('bg-slate-950', 'bg-gray-50')} ${text('text-slate-100', 'text-gray-900')} transition-colors duration-200`}>
        <div className="flex relative">
          {/* Menu latéral gauche - Navigation principale */}
          <div className={`w-[72px] ${bg('bg-slate-900', 'bg-white')} ${border('border-slate-800', 'border-gray-200')} border-r h-screen flex flex-col items-center py-4 gap-2`}>
            {/* Logo/Icône app */}
            <div className={`w-12 h-12 rounded-xl ${bg('bg-blue-600', 'bg-blue-600')} flex items-center justify-center mb-4`}>
              <span className="text-white font-bold text-lg">D3E</span>
            </div>

            {/* Séparateur */}
            <div className={`w-8 h-px ${bg('bg-slate-800', 'bg-gray-200')} my-2`}></div>

            {/* Menu Dashboard Global */}
            <button
              onClick={() => setActiveMenu('dashboard')}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
                activeMenu === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                  : isDark
                    ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              }`}
              title="Dashboard Global"
            >
              <Home className="w-6 h-6" />
            </button>

            {/* Menu Demandes */}
            <button
              onClick={() => {
                setActiveMenu('requests');
                // Select the first (most recent) request by default (array is sorted newest first)
                if (caseFiles.length > 0) {
                  setSelectedCaseFile(caseFiles[0].id);
                }
              }}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
                activeMenu === 'requests'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                  : isDark
                    ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              }`}
              title="Demandes"
            >
              <FileText className="w-6 h-6" />
            </button>

            {/* Menu Ventes */}
            <button
              onClick={() => setActiveMenu('sales')}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
                activeMenu === 'sales'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                  : isDark
                    ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              }`}
              title="Ventes"
            >
              <ShoppingCart className="w-6 h-6" />
            </button>

            {/* Menu Entrepôt 3D */}
            <button
              onClick={() => setActiveMenu('warehouse')}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
                activeMenu === 'warehouse'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                  : isDark
                    ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              }`}
              title="Entrepôt 3D"
            >
              <Package className="w-6 h-6" />
            </button>

            {/* Menu Ressources Humaines */}
            <button
              onClick={() => setActiveMenu('hr')}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
                activeMenu === 'hr'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                  : isDark
                    ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              }`}
              title="Ressources Humaines"
            >
              <Users className="w-6 h-6" />
            </button>
          </div>

          {/* Contenu conditionnel selon le menu actif */}
          {activeMenu === 'requests' && (
            <>
              {/* Sidebar liste des demandes */}
              <div
            className={`sidebar-scroll w-80 ${bg('bg-slate-900', 'bg-white')} ${border('border-slate-800', 'border-gray-200')} border-r h-screen overflow-y-auto`}
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: isDark ? '#475569 #1e293b' : '#cbd5e1 #f1f5f9',
            }}
          >
          <div className={`p-4 ${border('border-slate-800', 'border-gray-200')} border-b`}>
            <h1 className={`text-xl font-bold ${text('text-white', 'text-gray-900')} mb-4`}>D3E Collection</h1>
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${text('text-slate-500', 'text-gray-400')}`} />
              <input
                type="text"
                placeholder="Rechercher un dossier..."
                className={`w-full ${bg('bg-slate-800', 'bg-gray-100')} ${border('border-slate-700', 'border-gray-300')} border rounded-lg pl-10 pr-4 py-2 text-sm ${text('text-white', 'text-gray-900')} ${text('placeholder-slate-500', 'placeholder-gray-500')} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="mt-3 flex gap-2">
              <select
                className={`custom-select flex-1 ${bg('bg-slate-800', 'bg-gray-100')} ${border('border-slate-700', 'border-gray-300')} border rounded-lg px-3 py-2 text-sm ${text('text-white', 'text-gray-900')} cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500`}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Tous les statuts</option>
                <option value="diagnostic_pending">À diagnostiquer</option>
                <option value="quote_pending">Devis en attente</option>
                <option value="quote_approved">Devis approuvé</option>
                <option value="in_collection">En collecte</option>
                <option value="in_progress">En cours</option>
                <option value="completed">Terminé</option>
              </select>
              <button
                onClick={() => setIsFilterPanelOpen(true)}
                className={`p-2 ${bg('bg-slate-800', 'bg-gray-100')} ${border('border-slate-700', 'border-gray-300')} border rounded-lg ${bg('hover:bg-slate-700', 'hover:bg-gray-200')} transition-colors`}
              >
                <Filter className={`w-4 h-4 ${text('text-slate-400', 'text-gray-600')}`} />
              </button>
            </div>

            {/* Bouton Créer une demande */}
            <button
              onClick={() => setIsRequestPanelOpen(true)}
              className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Créer une demande
            </button>
          </div>

          {/* Liste des dossiers */}
          <div className="p-2">
            {isLoadingCaseFiles ? (
              <div className="flex items-center justify-center py-8">
                <div className={`text-sm ${subTextClasses}`}>Chargement des dossiers...</div>
              </div>
            ) : filteredCaseFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4">
                <div className={`text-sm ${subTextClasses} text-center`}>
                  {searchTerm || filterStatus !== 'all'
                    ? 'Aucun dossier ne correspond aux critères de recherche'
                    : 'Aucun dossier trouvé'}
                </div>
                {(searchTerm || filterStatus !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterStatus('all');
                    }}
                    className={`mt-3 text-xs ${text('text-blue-600', 'text-blue-600')} hover:underline`}
                  >
                    Réinitialiser les filtres
                  </button>
                )}
              </div>
            ) : (
              filteredCaseFiles.map((file) => (
              <button
                key={file.id}
                onClick={() => setSelectedCaseFile(file.id)}
                className={`w-full text-left p-3 mb-2 rounded-lg transition-colors ${
                  selectedCaseFile === file.id
                    ? 'bg-blue-600 text-white'
                    : isDark
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium">{file.reference}</div>
                    <div className="text-xs opacity-80 mt-1">{file.client}</div>
                  </div>
                  {file.notifications > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {file.notifications}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-1 rounded border ${getStatusColor(file.status)}`}>
                    {getStatusLabel(file.status)}
                  </span>
                  <AlertCircle className={`w-3 h-3 ${getPriorityColor(file.priority)}`} />
                </div>
                <div className="text-xs opacity-70">
                  <div className="flex justify-between">
                    <span>Créé: {file.createdAt}</span>
                    {file.collectionDate && <span>Collecte: {file.collectionDate}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs mt-2 pt-2 border-t border-white/10">
                  <div className="flex items-center gap-1">
                    <Euro className="w-3 h-3 text-emerald-600" />
                    <span className="opacity-70">Est:</span>
                    <span className="font-medium">{(file.valeurEstimee || 0).toLocaleString()}€</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-cyan-600" />
                    <span className="opacity-70">Rev:</span>
                    <span className="font-medium">{(file.valeurRevente || 0).toLocaleString()}€</span>
                  </div>
                </div>
              </button>
              ))
            )}
          </div>
        </div>

        {/* Contenu principal */}
        <div className="flex-1 overflow-auto">
          {/* Header */}
          <div className={`${bg('bg-slate-900', 'bg-white')} ${border('border-slate-800', 'border-gray-200')} border-b p-4`}>
            <div className={`flex items-center text-sm ${text('text-slate-400', 'text-gray-500')} mb-3`}>
              <span>Clients</span>
              <ChevronRight className="w-4 h-4 mx-1" />
              <span>{currentFile?.client}</span>
              <ChevronRight className="w-4 h-4 mx-1" />
              <span>{currentFile?.site}</span>
              <ChevronRight className="w-4 h-4 mx-1" />
              <span className={`${text('text-white', 'text-gray-900')} font-medium`}>Dossier {currentFile?.reference}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className={`text-2xl font-bold ${text('text-white', 'text-gray-900')}`}>{currentFile?.reference}</h2>
                <span className={`px-3 py-1 rounded-lg text-sm font-medium border ${getStatusColor(currentFile?.status || '')}`}>
                  {getStatusLabel(currentFile?.status || '')}
                </span>
                {currentFile && currentFile.notifications > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-lg">
                    <Bell className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-red-600">{currentFile.notifications} alertes</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button className={`px-4 py-2 ${bg('bg-slate-800', 'bg-gray-100')} ${bg('hover:bg-slate-700', 'hover:bg-gray-200')} ${border('border-slate-700', 'border-gray-300')} border ${text('text-white', 'text-gray-900')} rounded-lg text-sm font-medium transition-colors flex items-center`}>
                  <QrCode className="w-4 h-4 mr-2" />
                  Scanner
                </button>
                <button className={`px-4 py-2 ${bg('bg-slate-800', 'bg-gray-100')} ${bg('hover:bg-slate-700', 'hover:bg-gray-200')} ${border('border-slate-700', 'border-gray-300')} border ${text('text-white', 'text-gray-900')} rounded-lg text-sm font-medium transition-colors flex items-center`}>
                  <Download className="w-4 h-4 mr-2" />
                  Rapport
                </button>
                {/* Bouton de switch de thème */}
                <button
                  onClick={cycleTheme}
                  className={`px-4 py-2 ${bg('bg-slate-800', 'bg-gray-100')} ${bg('hover:bg-slate-700', 'hover:bg-gray-200')} ${border('border-slate-700', 'border-gray-300')} border ${text('text-white', 'text-gray-900')} rounded-lg text-sm font-medium transition-colors flex items-center group relative`}
                  title={`Mode: ${getThemeLabel()} - Cliquer pour changer`}
                >
                  <ThemeIcon className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">{getThemeLabel()}</span>
                  {/* Tooltip */}
                  <span className={`absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 ${bg('bg-slate-700', 'bg-gray-700')} text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10`}>
                    {themeMode === 'light' && 'Passer au mode Sombre'}
                    {themeMode === 'dark' && 'Passer au mode Auto'}
                    {themeMode === 'auto' && 'Passer au mode Clair'}
                  </span>
                </button>
                <button
                  onClick={() => setIsRequestPanelOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle Demande
                </button>
              </div>
            </div>
          </div>

          {/* Navigation onglets */}
          <div className={`${bg('bg-slate-900', 'bg-white')} ${border('border-slate-800', 'border-gray-200')} border-b px-4`}>
            <div className="flex gap-1">
              {tabs
                .filter(tab => tab.id !== 'dashboard') // Remove dashboard tab when viewing a request
                .map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 font-medium text-sm transition-colors flex items-center gap-2 border-b-2 ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-blue-500'
                      : isDark
                        ? 'text-slate-400 border-transparent hover:text-slate-300'
                        : 'text-gray-600 border-transparent hover:text-gray-900'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Contenu de l'onglet */}
          <div className="p-6">{renderTabContent()}</div>
        </div>

        {/* Panneau latéral droit - Formulaire de demande */}
        {isRequestPanelOpen && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black/50 z-40 animate-fadeIn"
              onClick={() => {
                setIsRequestPanelOpen(false);
                setIsEditMode(false);
              }}
              style={{
                animation: 'fadeIn 0.3s ease-out'
              }}
            ></div>

            {/* Panneau */}
            <div
              className={`fixed right-0 top-0 h-screen w-1/2 ${bg('bg-slate-900', 'bg-white')} ${border('border-slate-800', 'border-gray-200')} border-l z-50 overflow-y-auto shadow-2xl animate-slideInRight`}
              style={{
                animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              {/* Header du panneau */}
              <div className={`sticky top-0 ${bg('bg-slate-900', 'bg-white')} ${border('border-slate-800', 'border-gray-200')} border-b p-6 z-10`}>
                <div className="flex items-center justify-between mb-2">
                  <h2 className={`text-2xl font-bold ${headingClasses} flex items-center`}>
                    <FileText className="w-6 h-6 mr-3 text-blue-600" />
                    {isEditMode ? 'Modifier la Demande d\'Enlèvement' : 'Nouvelle Demande d\'Enlèvement'}
                  </h2>
                  <button
                    onClick={() => {
                      setIsRequestPanelOpen(false);
                      setIsEditMode(false);
                    }}
                    className={`p-2 ${bg('hover:bg-slate-800', 'hover:bg-gray-100')} rounded-lg transition-colors`}
                  >
                    <X className={`w-5 h-5 ${subTextClasses}`} />
                  </button>
                </div>
                <p className={`text-sm ${subTextClasses}`}>
                  {isEditMode
                    ? 'Modifier les informations de la demande de collecte D3E'
                    : 'Créer une nouvelle demande de collecte D3E'}
                </p>
              </div>

              {/* Formulaire */}
              <form onSubmit={handleSubmitRequest} className="p-6 space-y-6">
                {/* Section Client & Site */}
                <div className="space-y-4">
                  <div className={`flex items-center gap-2 pb-2 ${border('border-slate-800', 'border-gray-200')} border-b`}>
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <h3 className={`text-lg font-semibold ${headingClasses}`}>Informations Client & Site</h3>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${text('text-slate-300', 'text-gray-700')} mb-2`}>
                      Nom du Client <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="clientName"
                      value={formData.clientName}
                      onChange={handleInputChange}
                      required
                      className={`w-full ${inputClasses} border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="Ex: TechCorp Industries"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${text('text-slate-300', 'text-gray-700')} mb-2`}>
                      Nom du Site <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="siteName"
                      value={formData.siteName}
                      onChange={handleInputChange}
                      required
                      className={`w-full ${inputClasses} border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="Ex: Siège Paris 15"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${text('text-slate-300', 'text-gray-700')} mb-2`}>
                      Adresse Complète <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      name="siteAddress"
                      value={formData.siteAddress}
                      onChange={handleInputChange}
                      required
                      rows={2}
                      className={`w-full ${inputClasses} border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
                      placeholder="15 Avenue de la République, 75015 Paris"
                    />
                  </div>
                </div>

                {/* Section Contact */}
                <div className="space-y-4">
                  <div className={`flex items-center gap-2 pb-2 border-b ${border('border-slate-800', 'border-gray-200')}`}>
                    <Users className="w-5 h-5 text-purple-600" />
                    <h3 className={`text-lg font-semibold ${headingClasses}`}>Contact sur Site</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${text('text-slate-300', 'text-gray-700')} mb-2`}>
                        Nom Complet <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        name="contactName"
                        value={formData.contactName}
                        onChange={handleInputChange}
                        required
                        className={`w-full ${inputClasses} border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        placeholder="Pierre Durand"
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium ${text('text-slate-300', 'text-gray-700')} mb-2`}>
                        Fonction
                      </label>
                      <input
                        type="text"
                        name="contactFunction"
                        value={formData.contactFunction}
                        onChange={handleInputChange}
                        className={`w-full ${inputClasses} border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        placeholder="Responsable IT"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${text('text-slate-300', 'text-gray-700')} mb-2`}>
                        Téléphone <span className="text-red-600">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type="tel"
                          name="contactPhone"
                          value={formData.contactPhone}
                          onChange={handleInputChange}
                          required
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="+33 1 23 45 67 89"
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium ${text('text-slate-300', 'text-gray-700')} mb-2`}>
                        Email <span className="text-red-600">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type="email"
                          name="contactEmail"
                          value={formData.contactEmail}
                          onChange={handleInputChange}
                          required
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="p.durand@techcorp.fr"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section Description */}
                <div className="space-y-4">
                  <div className={`flex items-center gap-2 pb-2 border-b ${border('border-slate-800', 'border-gray-200')}`}>
                    <Clipboard className="w-5 h-5 text-cyan-600" />
                    <h3 className={`text-lg font-semibold ${headingClasses}`}>Description de la Demande</h3>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${text('text-slate-300', 'text-gray-700')} mb-2`}>
                      Description Détaillée <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      rows={4}
                      className={`w-full ${inputClasses} border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
                      placeholder="Ex: Enlèvement de matériel informatique : 50 unités centrales, 30 écrans LCD, serveurs et accessoires..."
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Décrivez le type et la quantité approximative de matériel
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${text('text-slate-300', 'text-gray-700')} mb-2`}>
                        Catégorie Principale
                      </label>
                      <select
                        name="mainCategory"
                        value={formData.mainCategory}
                        onChange={handleInputChange}
                        className={`custom-select w-full ${inputClasses} border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer`}
                      >
                        <option value="">Sélectionnez une catégorie</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.nom}>{cat.nom}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium ${text('text-slate-300', 'text-gray-700')} mb-2`}>
                        Volume Estimé
                      </label>
                      <input
                        type="text"
                        name="estimatedVolume"
                        value={formData.estimatedVolume}
                        onChange={handleInputChange}
                        className={`w-full ${inputClasses} border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        placeholder="Ex: 3 palettes"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${text('text-slate-300', 'text-gray-700')} mb-2`}>
                        Valeur Estimée (€)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="valeurEstimee"
                        value={formData.valeurEstimee}
                        onChange={handleInputChange}
                        className={`w-full ${inputClasses} border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        placeholder="Ex: 5000"
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium ${text('text-slate-300', 'text-gray-700')} mb-2`}>
                        Valeur Revente (€)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="valeurRevente"
                        value={formData.valeurRevente}
                        onChange={handleInputChange}
                        className={`w-full ${inputClasses} border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        placeholder="Ex: 3000"
                      />
                    </div>
                  </div>
                </div>

                {/* Section Planification */}
                <div className="space-y-4">
                  <div className={`flex items-center gap-2 pb-2 border-b ${border('border-slate-800', 'border-gray-200')}`}>
                    <Calendar className="w-5 h-5 text-emerald-600" />
                    <h3 className={`text-lg font-semibold ${headingClasses}`}>Planification</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${text('text-slate-300', 'text-gray-700')} mb-2`}>
                        Date de Visite Souhaitée
                      </label>
                      <input
                        type="date"
                        name="plannedVisitDate"
                        value={formData.plannedVisitDate}
                        onChange={handleInputChange}
                        className={`w-full ${inputClasses} border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium ${text('text-slate-300', 'text-gray-700')} mb-2`}>
                        Priorité
                      </label>
                      <select
                        name="priority"
                        value={formData.priority}
                        onChange={handleInputChange}
                        className={`custom-select w-full ${inputClasses} border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer`}
                      >
                        <option value="low">🟢 Basse</option>
                        <option value="medium">🟡 Moyenne</option>
                        <option value="high">🔴 Haute</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${text('text-slate-300', 'text-gray-700')} mb-2`}>
                      Notes d'Accès
                    </label>
                    <textarea
                      name="accessNotes"
                      value={formData.accessNotes}
                      onChange={handleInputChange}
                      rows={2}
                      className={`w-full ${inputClasses} border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
                      placeholder="Ex: Accès par quai de chargement, badge nécessaire..."
                    />
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="flex gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsRequestPanelOpen(false)}
                    className={`flex-1 px-4 py-3 ${bg('bg-slate-800', 'bg-gray-100')} ${bg('hover:bg-slate-700', 'hover:bg-gray-200')} ${border('border-slate-700', 'border-gray-300')} border ${text('text-white', 'text-gray-900')} rounded-lg font-medium transition-colors`}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Enregistrer la Demande
                  </button>
                </div>
              </form>
            </div>
          </>
        )}

        {/* Panneau latéral droit - Édition de composant */}
        {isComponentPanelOpen && selectedComponent && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black/50 z-40 animate-fadeIn"
              onClick={() => setIsComponentPanelOpen(false)}
              style={{
                animation: 'fadeIn 0.3s ease-out'
              }}
            ></div>

            {/* Panneau */}
            <div
              className={`fixed right-0 top-0 h-screen w-1/2 ${bg('bg-slate-900', 'bg-white')} ${border('border-slate-800', 'border-gray-200')} border-l z-50 overflow-y-auto shadow-2xl animate-slideInRight`}
              style={{
                animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              {/* Header du panneau */}
              <div className={`sticky top-0 ${bg('bg-slate-900', 'bg-white')} ${border('border-slate-800', 'border-gray-200')} border-b p-6 z-10`}>
                <div className="flex items-center justify-between mb-2">
                  <h2 className={`text-2xl font-bold ${headingClasses} flex items-center`}>
                    <FileEdit className="w-6 h-6 mr-3 text-purple-600" />
                    Édition du Composant
                  </h2>
                  <button
                    onClick={() => setIsComponentPanelOpen(false)}
                    className={`p-2 ${bg('hover:bg-slate-800', 'hover:bg-gray-100')} rounded-lg transition-colors`}
                  >
                    <X className={`w-5 h-5 ${subTextClasses}`} />
                  </button>
                </div>
                <p className={`text-sm ${subTextClasses}`}>
                  Modifier les informations du composant
                </p>
              </div>

              {/* Contenu */}
              <div className="p-6 space-y-6">
                {/* Informations du composant */}
                <div className="space-y-4">
                  <div className={`flex items-center gap-2 pb-2 ${border('border-slate-800', 'border-gray-200')} border-b`}>
                    <Package className="w-5 h-5 text-purple-600" />
                    <h3 className={`text-lg font-semibold ${headingClasses}`}>Informations Générales</h3>
                  </div>

                  {/* ID et QR Code (lecture seule) */}
                  <div className={`p-4 ${bg('bg-slate-800/50', 'bg-gray-50')} rounded-lg`}>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-xs font-medium ${subTextClasses} mb-1`}>
                          ID Composant
                        </label>
                        <div className={`text-sm ${text('text-slate-300', 'text-gray-700')} font-mono`}>
                          {selectedComponent.id}
                        </div>
                      </div>
                      <div>
                        <label className={`block text-xs font-medium ${subTextClasses} mb-1`}>
                          Code QR
                        </label>
                        <div className={`text-sm ${text('text-slate-300', 'text-gray-700')} font-mono flex items-center gap-2`}>
                          <QrCode className="w-4 h-4" />
                          {selectedComponent.qrCode}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Nom de l'équipement */}
                  <div>
                    <label className={`block text-sm font-medium ${text('text-slate-300', 'text-gray-700')} mb-2`}>
                      Nom de l'équipement <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={selectedComponent.nom || selectedComponent.categorieName || ''}
                      onChange={(e) => setSelectedComponent({...selectedComponent, nom: e.target.value})}
                      className={`w-full ${inputClasses} ${border('border-slate-700', 'border-gray-300')} border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500`}
                      placeholder="Ex: PC Dell OptiPlex 7090, Écran HP 24..."
                    />
                  </div>

                  {/* Quantité */}
                  <div>
                    <label className={`block text-sm font-medium ${text('text-slate-300', 'text-gray-700')} mb-2`}>
                      Quantité <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={selectedComponent.quantite || 1}
                      onChange={(e) => setSelectedComponent({...selectedComponent, quantite: parseInt(e.target.value) || 1})}
                      className={`w-full ${inputClasses} ${border('border-slate-700', 'border-gray-300')} border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500`}
                      placeholder="1"
                    />
                  </div>

                  {/* Catégorie */}
                  <div>
                    <label className={`block text-sm font-medium ${text('text-slate-300', 'text-gray-700')} mb-2`}>
                      Catégorie <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={selectedCategoryId}
                      onChange={(e) => {
                        setSelectedCategoryId(e.target.value);
                        setSelectedComponent({...selectedComponent, subCategoryId: ''});
                      }}
                      className={`custom-select w-full ${inputClasses} ${border('border-slate-700', 'border-gray-300')} border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer`}
                    >
                      <option value="">Sélectionnez une catégorie</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.nom}</option>
                      ))}
                    </select>
                  </div>

                  {/* Sous-catégorie */}
                  <div>
                    <label className={`block text-sm font-medium ${text('text-slate-300', 'text-gray-700')} mb-2`}>
                      Sous-catégorie <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={selectedComponent.subCategoryId || ''}
                      onChange={(e) => setSelectedComponent({...selectedComponent, subCategoryId: e.target.value})}
                      className={`custom-select w-full ${inputClasses} ${border('border-slate-700', 'border-gray-300')} border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer`}
                      disabled={!selectedCategoryId || availableSubCategories.length === 0}
                    >
                      <option value="">Sélectionnez une sous-catégorie</option>
                      {availableSubCategories.map((subCat) => (
                        <option key={subCat.id} value={subCat.id}>{subCat.nom}</option>
                      ))}
                    </select>
                  </div>

                  {/* Grade */}
                  <div>
                    <label className={`block text-sm font-medium ${text('text-slate-300', 'text-gray-700')} mb-2`}>
                      Grade <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={selectedComponent.grade}
                      onChange={(e) => setSelectedComponent({...selectedComponent, grade: e.target.value})}
                      className={`custom-select w-full ${inputClasses} ${border('border-slate-700', 'border-gray-300')} border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer`}
                    >
                      <option value="A">Grade A - Excellent état</option>
                      <option value="B">Grade B - Bon état</option>
                      <option value="C">Grade C - État moyen</option>
                      <option value="D">Grade D - Mauvais état</option>
                      <option value="HS">HS - Hors service</option>
                    </select>
                  </div>

                  {/* Poids unitaire */}
                  <div>
                    <label className={`block text-sm font-medium ${text('text-slate-300', 'text-gray-700')} mb-2`}>
                      Poids Unitaire (kg) <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={selectedComponent.poidsUnitaire || selectedComponent.poids || ''}
                      onChange={(e) => setSelectedComponent({...selectedComponent, poidsUnitaire: parseFloat(e.target.value) || 0})}
                      className={`w-full ${inputClasses} ${border('border-slate-700', 'border-gray-300')} border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500`}
                      placeholder="0.00"
                    />
                    <div className={`text-xs ${subTextClasses} mt-1`}>
                      Poids par unité (sera multiplié par la quantité)
                    </div>
                  </div>

                  {/* Valeur unitaire estimée */}
                  <div>
                    <label className={`block text-sm font-medium ${text('text-slate-300', 'text-gray-700')} mb-2`}>
                      Valeur Unitaire Estimée (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={selectedComponent.valeurUnitaire || selectedComponent.valeurEstimee || ''}
                      onChange={(e) => setSelectedComponent({...selectedComponent, valeurUnitaire: parseFloat(e.target.value) || null})}
                      className={`w-full ${inputClasses} ${border('border-slate-700', 'border-gray-300')} border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500`}
                      placeholder="0.00"
                    />
                    <div className={`text-xs ${subTextClasses} mt-1`}>
                      Valeur par unité (sera multipliée par la quantité)
                    </div>
                  </div>

                  {/* Statut */}
                  <div>
                    <label className={`block text-sm font-medium ${text('text-slate-300', 'text-gray-700')} mb-2`}>
                      Statut <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={selectedComponent.statut}
                      onChange={(e) => setSelectedComponent({...selectedComponent, statut: e.target.value})}
                      className={`custom-select w-full ${inputClasses} ${border('border-slate-700', 'border-gray-300')} border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer`}
                    >
                      <option value="extracted">Extrait</option>
                      <option value="tested">Testé</option>
                      <option value="graded">Gradé</option>
                      <option value="stored">Stocké</option>
                      <option value="sold">Vendu</option>
                      <option value="recycled">Recyclé</option>
                    </select>
                  </div>
                </div>

                {/* Informations supplémentaires */}
                <div className="space-y-4">
                  <div className={`flex items-center gap-2 pb-2 ${border('border-slate-800', 'border-gray-200')} border-b`}>
                    <Info className="w-5 h-5 text-blue-600" />
                    <h3 className={`text-lg font-semibold ${headingClasses}`}>Informations Complémentaires</h3>
                  </div>

                  <div className={`p-4 ${bg('bg-slate-800/50', 'bg-gray-50')} rounded-lg space-y-3`}>
                    <div className="flex justify-between">
                      <span className={`text-sm ${subTextClasses}`}>Date de création</span>
                      <span className={`text-sm ${text('text-slate-300', 'text-gray-700')}`}>
                        {new Date(selectedComponent.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`text-sm ${subTextClasses}`}>Dernière modification</span>
                      <span className={`text-sm ${text('text-slate-300', 'text-gray-700')}`}>
                        {new Date(selectedComponent.updatedAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`text-sm ${subTextClasses}`}>ID du lot</span>
                      <span className={`text-sm ${text('text-slate-300', 'text-gray-700')} font-mono`}>
                        {selectedComponent.lotId}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className={`flex gap-3 pt-4 ${border('border-slate-800', 'border-gray-200')} border-t`}>
                  <button
                    type="button"
                    onClick={() => setIsComponentPanelOpen(false)}
                    className={`flex-1 px-4 py-3 ${bg('bg-slate-800', 'bg-gray-100')} ${bg('hover:bg-slate-700', 'hover:bg-gray-200')} ${border('border-slate-700', 'border-gray-300')} border ${text('text-white', 'text-gray-900')} rounded-lg font-medium transition-colors`}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const response = await fetch(`https://valotik-api-546691893264.europe-west1.run.app/api/components/${selectedComponent.id}`, {
                          method: 'PUT',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            categorieName: selectedComponent.categorieName,
                            grade: selectedComponent.grade,
                            poids: selectedComponent.poids,
                            valeurEstimee: selectedComponent.valeurEstimee,
                            statut: selectedComponent.statut,
                          }),
                        });

                        const result = await response.json();

                        if (result.success) {
                          // Recharger les détails du dossier pour mettre à jour l'affichage
                          await loadCaseFileDetails(selectedCaseFile);
                          setIsComponentPanelOpen(false);
                        } else {
                          alert('Erreur lors de la mise à jour du composant');
                        }
                      } catch (error) {
                        console.error('Error updating component:', error);
                        alert('Erreur lors de la mise à jour du composant');
                      }
                    }}
                    className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Enregistrer les Modifications
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

      {/* Panneau de démantèlement */}
      <DismantlingPanel />
            </>
          )}

          {/* Dashboard Global */}
          {activeMenu === 'dashboard' && (
            <div className="flex-1 overflow-auto px-8 py-6">
              <DashboardTab />
            </div>
          )}

          {/* Dashboard des Ventes */}
          {activeMenu === 'sales' && (
            <>
              {/* Panel gauche : Liste des demandes */}
              <div
                className={`sidebar-scroll w-80 ${bg('bg-slate-900', 'bg-white')} ${border('border-slate-800', 'border-gray-200')} border-r h-screen overflow-y-auto`}
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: isDark ? '#475569 #1e293b' : '#cbd5e1 #f1f5f9',
                }}
              >
                {/* En-tête avec recherche et filtres */}
                <div className={`p-4 ${border('border-slate-800', 'border-gray-200')} border-b`}>
                  <div className="flex items-center justify-between mb-4">
                    <h1 className={`text-xl font-bold ${text('text-white', 'text-gray-900')}`}>Ventes</h1>
                    {selectedSaleCaseFile && (
                      <button
                        onClick={() => setSelectedSaleCaseFile(null)}
                        className={`p-2 ${bg('bg-slate-800', 'bg-gray-100')} ${border('border-slate-700', 'border-gray-300')} border rounded-lg ${bg('hover:bg-slate-700', 'hover:bg-gray-200')} transition-colors`}
                        title="Retour au dashboard"
                      >
                        <BarChart3 className={`w-4 h-4 ${text('text-slate-400', 'text-gray-600')}`} />
                      </button>
                    )}
                  </div>

                    {/* Barre de recherche */}
                    <div className="relative">
                      <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${text('text-slate-500', 'text-gray-400')}`} />
                      <input
                        type="text"
                        placeholder="Rechercher une vente..."
                        className={`w-full ${bg('bg-slate-800', 'bg-gray-100')} ${border('border-slate-700', 'border-gray-300')} border rounded-lg pl-10 pr-4 py-2 text-sm ${text('text-white', 'text-gray-900')} ${text('placeholder-slate-500', 'placeholder-gray-500')} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>

                    {/* Filtres */}
                    <div className="mt-3 flex gap-2">
                      <select
                        className={`custom-select flex-1 ${bg('bg-slate-800', 'bg-gray-100')} ${border('border-slate-700', 'border-gray-300')} border rounded-lg px-3 py-2 text-sm ${text('text-white', 'text-gray-900')} cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                      >
                        <option value="all">Tous les statuts</option>
                        <option value="completed">Complété</option>
                        <option value="pending">En attente</option>
                        <option value="cancelled">Annulé</option>
                      </select>
                      <button className={`p-2 ${bg('bg-slate-800', 'bg-gray-100')} ${border('border-slate-700', 'border-gray-300')} border rounded-lg ${bg('hover:bg-slate-700', 'hover:bg-gray-200')}`}>
                        <Filter className={`w-4 h-4 ${text('text-slate-400', 'text-gray-600')}`} />
                      </button>
                    </div>

                    {/* Info nombre de demandes */}
                    <p className={`mt-3 text-xs font-medium ${text('text-slate-400', 'text-gray-600')} uppercase tracking-wide`}>
                      {salesListLoading ? 'Chargement...' : `${salesCaseFiles.length} demandes avec ventes`}
                    </p>
                  </div>

                  {/* Liste des demandes */}
                  <div className="p-2">
                    {salesListLoading ? (
                      <div className="flex items-center justify-center h-64">
                        <p className={`text-sm ${text('text-slate-400', 'text-gray-500')}`}>Chargement...</p>
                      </div>
                    ) : salesCaseFiles.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-64 px-6">
                        <ShoppingCart className={`w-12 h-12 ${text('text-slate-600', 'text-gray-400')} mb-3`} />
                        <p className={`${text('text-slate-400', 'text-gray-500')} text-sm text-center`}>Aucune demande avec ventes</p>
                        <p className={`${text('text-slate-500', 'text-gray-400')} text-xs text-center mt-1`}>
                          Pour la période sélectionnée
                        </p>
                      </div>
                    ) : (
                      <>
                        {salesCaseFiles.map((caseFile: any) => (
                          <button
                            key={caseFile.id}
                            onClick={() => setSelectedSaleCaseFile(caseFile.id)}
                            className={`w-full text-left p-3 mb-2 rounded-lg transition-colors ${
                              selectedSaleCaseFile === caseFile.id
                                ? 'bg-blue-600 text-white'
                                : isDark
                                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                          >
                            {/* Reference and Client */}
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="font-medium">{caseFile.reference}</div>
                                <div className="text-xs opacity-80 mt-1">{caseFile.request?.client?.raisonSociale || 'Client inconnu'}</div>
                              </div>
                            </div>

                            {/* Statistiques */}
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-600 border border-blue-500/30">
                                {caseFile.stats?.totalVentes || 0} ventes
                              </span>
                              <span className="text-xs px-2 py-1 rounded bg-emerald-500/20 text-emerald-600 border border-emerald-500/30">
                                {caseFile.stats?.salesRate || 0}%
                              </span>
                            </div>

                            {/* Date de création */}
                            <div className="text-xs opacity-70">
                              <div className="flex justify-between">
                                <span>Créé: {new Date(caseFile.createdAt).toLocaleDateString('fr-FR')}</span>
                              </div>
                            </div>

                            {/* Progress Bar - Revenue */}
                            <div className="mt-2 pt-2 border-t border-white/10">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs opacity-70">Revenu total</span>
                                <span className="text-xs font-semibold">{(caseFile.stats?.totalRevenue || 0).toLocaleString('fr-FR', { minimumFractionDigits: 0 })} €</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-600 rounded-full h-2">
                                  <div
                                    className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${caseFile.stats?.salesRate || 0}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                </div>

                {/* Panel droit : Dashboard ou détails de la demande */}
                <div className="flex-1 overflow-auto">
                  {!selectedSaleCaseFile ? (
                    // Afficher le dashboard si aucune demande sélectionnée
                    <div className="px-8 py-6">
                      <SalesDashboardTab />
                    </div>
                  ) : selectedSaleCaseFile && salesCaseFiles.find(cf => cf.id === selectedSaleCaseFile) ? (
                    // Afficher les détails de la demande sélectionnée
                    <div className="p-8">
                      {(() => {
                        const caseFile = salesCaseFiles.find(cf => cf.id === selectedSaleCaseFile);
                        return (
                          <>
                            {/* En-tête de la demande */}
                            <div className="mb-6">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h1 className={`text-3xl font-bold ${text('text-white', 'text-gray-900')}`}>
                                    {caseFile.reference}
                                  </h1>
                                  <p className={`${text('text-slate-400', 'text-gray-600')} mt-2`}>
                                    {caseFile.request?.client?.raisonSociale || 'Client inconnu'}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <div className="px-4 py-2 rounded-lg font-medium bg-blue-600/20 text-blue-600">
                                    {caseFile.stats?.totalVentes || 0} ventes
                                  </div>
                                  <div className="px-4 py-2 rounded-lg font-medium bg-emerald-600/20 text-emerald-600">
                                    {caseFile.stats?.salesRate || 0}% vendu
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Statistiques de la demande */}
                            <div className="grid grid-cols-3 gap-4 mb-6">
                              <div className={`${bg('bg-slate-900', 'bg-white')} ${border('border-slate-800', 'border-gray-200')} border rounded-lg p-4`}>
                                <p className={`text-sm ${text('text-slate-400', 'text-gray-600')}`}>Revenu Total</p>
                                <p className={`text-2xl font-bold ${text('text-white', 'text-gray-900')} mt-1`}>
                                  {(caseFile.stats?.totalRevenue || 0).toLocaleString('fr-FR', { minimumFractionDigits: 0 })} €
                                </p>
                              </div>
                              <div className={`${bg('bg-slate-900', 'bg-white')} ${border('border-slate-800', 'border-gray-200')} border rounded-lg p-4`}>
                                <p className={`text-sm ${text('text-slate-400', 'text-gray-600')}`}>Composants Vendus</p>
                                <p className={`text-2xl font-bold ${text('text-white', 'text-gray-900')} mt-1`}>
                                  {caseFile.stats?.soldComponents || 0} / {caseFile.stats?.totalComponents || 0}
                                </p>
                              </div>
                              <div className={`${bg('bg-slate-900', 'bg-white')} ${border('border-slate-800', 'border-gray-200')} border rounded-lg p-4`}>
                                <p className={`text-sm ${text('text-slate-400', 'text-gray-600')}`}>Taux de Vente</p>
                                <p className={`text-2xl font-bold text-emerald-600 mt-1`}>
                                  {caseFile.stats?.salesRate || 0}%
                                </p>
                              </div>
                            </div>

                            {/* Liste des ventes */}
                            <div className={`${bg('bg-slate-900', 'bg-white')} ${border('border-slate-800', 'border-gray-200')} border rounded-lg p-6`}>
                              <h3 className={`text-lg font-semibold ${text('text-white', 'text-gray-900')} mb-4`}>
                                Ventes ({caseFileSales.length})
                              </h3>

                              {caseFileSales.length === 0 ? (
                                <div className="text-center py-8">
                                  <ShoppingCart className={`w-12 h-12 ${text('text-slate-600', 'text-gray-400')} mx-auto mb-3`} />
                                  <p className={`${text('text-slate-400', 'text-gray-500')} text-sm`}>Aucune vente pour cette demande</p>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {caseFileSales.map((sale: any) => (
                                    <div key={sale.id} className={`${bg('bg-slate-800/50', 'bg-gray-50')} ${border('border-slate-700', 'border-gray-200')} border rounded-lg p-4`}>
                                      <div className="flex items-start justify-between mb-3">
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <span className={`font-medium ${text('text-white', 'text-gray-900')}`}>{sale.reference}</span>
                                            <span className={`text-xs px-2 py-1 rounded ${
                                              sale.statut === 'completed'
                                                ? 'bg-green-500/20 text-green-600'
                                                : sale.statut === 'pending'
                                                  ? 'bg-yellow-500/20 text-yellow-600'
                                                  : 'bg-gray-500/20 text-gray-600'
                                            }`}>
                                              {sale.statut === 'completed' ? 'Complété' : sale.statut === 'pending' ? 'En attente' : 'Annulé'}
                                            </span>
                                            {sale.grade && (
                                              <span className={`text-xs px-2 py-1 rounded font-bold ${
                                                sale.grade === 'A' ? 'bg-green-600/20 text-green-600' :
                                                sale.grade === 'B' ? 'bg-blue-600/20 text-blue-600' :
                                                sale.grade === 'C' ? 'bg-orange-600/20 text-orange-600' :
                                                'bg-red-600/20 text-red-600'
                                              }`}>
                                                Grade {sale.grade}
                                              </span>
                                            )}
                                          </div>
                                          <p className={`text-sm ${text('text-slate-400', 'text-gray-600')} mt-1`}>
                                            {sale.productName}
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <p className={`text-lg font-bold text-blue-600`}>
                                            {sale.montantTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                                          </p>
                                          <p className={`text-xs ${text('text-slate-500', 'text-gray-500')}`}>
                                            {new Date(sale.dateVente).toLocaleDateString('fr-FR')}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                          <span className={`${text('text-slate-400', 'text-gray-600')}`}>Acheteur: </span>
                                          <span className={`${text('text-white', 'text-gray-900')}`}>{sale.acheteurNom}</span>
                                        </div>
                                        <div>
                                          <span className={`${text('text-slate-400', 'text-gray-600')}`}>Quantité: </span>
                                          <span className={`${text('text-white', 'text-gray-900')}`}>{sale.quantity}</span>
                                        </div>
                                        {sale.vendeurNom && (
                                          <div>
                                            <span className={`${text('text-slate-400', 'text-gray-600')}`}>Vendeur: </span>
                                            <span className={`${text('text-white', 'text-gray-900')}`}>{sale.vendeurNom}</span>
                                          </div>
                                        )}
                                        {sale.modePaiement && (
                                          <div>
                                            <span className={`${text('text-slate-400', 'text-gray-600')}`}>Paiement: </span>
                                            <span className={`${text('text-white', 'text-gray-900')} capitalize`}>{sale.modePaiement.replace('_', ' ')}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <FileText className={`w-16 h-16 ${text('text-slate-600', 'text-gray-400')} mx-auto mb-4`} />
                        <p className={`${text('text-slate-400', 'text-gray-500')} text-lg`}>Sélectionnez une demande</p>
                        <p className={`${text('text-slate-500', 'text-gray-400')} text-sm mt-2`}>
                          La liste des ventes s'affichera ici
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

          {/* Vue Entrepôt 3D */}
          {activeMenu === 'warehouse' && (
            <div className="flex-1 h-screen w-full relative">
              <iframe
                src="/warehouse_widget.html"
                className="w-full h-full border-0"
                title="Entrepôt 3D - Vue immersive"
                allow="fullscreen"
              />
            </div>
          )}

          {/* Vue Dashboard RH */}
          {activeMenu === 'hr' && (
            <div className={`flex-1 h-screen overflow-y-auto ${bg('bg-slate-950', 'bg-gray-50')} p-8`}>
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className={`text-3xl font-bold ${headingClasses} flex items-center gap-3`}>
                      <div className="p-3 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg">
                        <Users className="w-8 h-8" />
                      </div>
                      Dashboard Ressources Humaines
                    </h1>
                    <p className={`${subTextClasses} mt-2`}>
                      Gestion du personnel et des collaborateurs
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingUser(null);
                      setUserFormData({
                        nom: '',
                        email: '',
                        role: 'technicien',
                        actif: true,
                      });
                      setIsUserModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    Ajouter Personnel
                  </button>
                </div>

                {/* Statistiques RH */}
                {hrStats && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Personnel */}
                    <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-xl p-6 shadow-lg`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`${mutedTextClasses} text-sm font-medium mb-1`}>Total Personnel</p>
                          <p className={`${headingClasses} text-3xl font-bold`}>{hrStats.totalUsers}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                          <Users className="w-8 h-8" />
                        </div>
                      </div>
                    </div>

                    {/* Personnel Actif */}
                    <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-xl p-6 shadow-lg`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`${mutedTextClasses} text-sm font-medium mb-1`}>Personnel Actif</p>
                          <p className={`${headingClasses} text-3xl font-bold text-green-500`}>{hrStats.activeUsers}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
                          <UserCheck className="w-8 h-8" />
                        </div>
                      </div>
                    </div>

                    {/* Personnel Inactif */}
                    <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-xl p-6 shadow-lg`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`${mutedTextClasses} text-sm font-medium mb-1`}>Personnel Inactif</p>
                          <p className={`${headingClasses} text-3xl font-bold text-orange-500`}>{hrStats.inactiveUsers}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg">
                          <XCircle className="w-8 h-8" />
                        </div>
                      </div>
                    </div>

                    {/* Répartition par Rôle */}
                    <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-xl p-6 shadow-lg`}>
                      <div className="flex items-center justify-between mb-3">
                        <p className={`${mutedTextClasses} text-sm font-medium`}>Par Rôle</p>
                        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                          <Award className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        {hrStats.usersByRole && hrStats.usersByRole.map((item: any) => (
                          <div key={item.role} className="flex items-center justify-between">
                            <span className={`${subTextClasses} text-sm capitalize`}>{item.role}</span>
                            <span className={`${headingClasses} font-semibold`}>{item.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Filtres et Recherche */}
                <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-xl p-6 mb-6`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Recherche */}
                    <div className="relative">
                      <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${mutedTextClasses}`} />
                      <input
                        type="text"
                        placeholder="Rechercher par nom ou email..."
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 ${inputClasses} border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all`}
                      />
                    </div>

                    {/* Filtre par rôle */}
                    <select
                      value={userFilterRole}
                      onChange={(e) => setUserFilterRole(e.target.value)}
                      className={`w-full px-4 py-3 ${inputClasses} border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all`}
                    >
                      <option value="all">Tous les rôles</option>
                      <option value="admin">Administrateur</option>
                      <option value="planificateur">Planificateur</option>
                      <option value="technicien">Technicien</option>
                      <option value="logisticien">Logisticien</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Liste des Utilisateurs */}
              {isLoadingHrPersonnel ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className={`w-12 h-12 ${text('text-purple-500', 'text-purple-600')} animate-spin`} />
                </div>
              ) : (
                <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-xl shadow-lg overflow-hidden`}>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className={`${bg('bg-slate-800', 'bg-gray-100')}`}>
                        <tr>
                          <th className={`px-6 py-4 text-left text-sm font-semibold ${headingClasses}`}>Nom</th>
                          <th className={`px-6 py-4 text-left text-sm font-semibold ${headingClasses}`}>Email</th>
                          <th className={`px-6 py-4 text-left text-sm font-semibold ${headingClasses}`}>Rôle</th>
                          <th className={`px-6 py-4 text-left text-sm font-semibold ${headingClasses}`}>Statut</th>
                          <th className={`px-6 py-4 text-left text-sm font-semibold ${headingClasses}`}>Date création</th>
                          <th className={`px-6 py-4 text-right text-sm font-semibold ${headingClasses}`}>Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700">
                        {hrPersonnel
                          .filter(user => {
                            const matchesSearch = user.nom.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                                                  user.email.toLowerCase().includes(userSearchTerm.toLowerCase());
                            const matchesRole = userFilterRole === 'all' || user.role === userFilterRole;
                            return matchesSearch && matchesRole;
                          })
                          .map((user: any) => (
                            <tr key={user.id} className={`${bg('hover:bg-slate-800/50', 'hover:bg-gray-50')} transition-colors`}>
                              <td className={`px-6 py-4 ${headingClasses} font-medium`}>
                                {user.nom}
                              </td>
                              <td className={`px-6 py-4 ${subTextClasses}`}>
                                {user.email}
                              </td>
                              <td className={`px-6 py-4`}>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                  user.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                                  user.role === 'planificateur' ? 'bg-blue-500/20 text-blue-400' :
                                  user.role === 'technicien' ? 'bg-green-500/20 text-green-400' :
                                  'bg-orange-500/20 text-orange-400'
                                }`}>
                                  {user.role === 'admin' && '👑 Admin'}
                                  {user.role === 'planificateur' && '📋 Planificateur'}
                                  {user.role === 'technicien' && '🔧 Technicien'}
                                  {user.role === 'logisticien' && '📦 Logisticien'}
                                </span>
                              </td>
                              <td className={`px-6 py-4`}>
                                {user.actif ? (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Actif
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400">
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Inactif
                                  </span>
                                )}
                              </td>
                              <td className={`px-6 py-4 ${subTextClasses} text-sm`}>
                                {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                              </td>
                              <td className={`px-6 py-4 text-right`}>
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingUser(user);
                                      setUserFormData({
                                        // Informations générales
                                        nom: user.nom || '',
                                        email: user.email || '',
                                        role: user.role || 'technicien',
                                        actif: user.actif !== undefined ? user.actif : true,
                                        telephone: user.telephone || '',
                                        adresse: user.adresse || '',
                                        dateNaissance: user.dateNaissance || '',
                                        lieuNaissance: user.lieuNaissance || '',
                                        numeroSecu: user.numeroSecu || '',

                                        // Contrat
                                        typeContrat: user.typeContrat || 'CDI',
                                        dateDebut: user.dateDebut || '',
                                        dateFin: user.dateFin || '',
                                        poste: user.poste || '',
                                        salaireBrut: user.salaireBrut || '',
                                        heuresHebdo: user.heuresHebdo || '35',
                                        conventionCollective: user.conventionCollective || '',
                                        coefficient: user.coefficient || '',
                                        classification: user.classification || '',
                                        periodeEssai: user.periodeEssai || '',
                                        anciennete: user.anciennete || '',
                                      });
                                      setIsUserModalOpen(true);
                                    }}
                                    className="p-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 transition-colors"
                                    title="Modifier"
                                  >
                                    <FileEdit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (confirm(`Êtes-vous sûr de vouloir supprimer ${user.nom} ?`)) {
                                        try {
                                          const response = await fetch(`https://valotik-api-546691893264.europe-west1.run.app/api/users/${user.id}`, {
                                            method: 'DELETE',
                                          });
                                          if (response.ok) {
                                            // Recharger la liste
                                            const usersResponse = await fetch('https://valotik-api-546691893264.europe-west1.run.app/api/users');
                                            if (usersResponse.ok) {
                                              const usersData = await usersResponse.json();
                                              setHrPersonnel(usersData.data.users || []);
                                            }
                                          }
                                        } catch (error) {
                                          console.error('Erreur suppression:', error);
                                        }
                                      }
                                    }}
                                    className="p-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 transition-colors"
                                    title="Supprimer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>

                    {hrPersonnel.filter(user => {
                      const matchesSearch = user.nom.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                                            user.email.toLowerCase().includes(userSearchTerm.toLowerCase());
                      const matchesRole = userFilterRole === 'all' || user.role === userFilterRole;
                      return matchesSearch && matchesRole;
                    }).length === 0 && (
                      <div className="text-center py-12">
                        <Users className={`w-16 h-16 ${mutedTextClasses} mx-auto mb-4`} />
                        <p className={`${subTextClasses} text-lg`}>Aucun utilisateur trouvé</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Panneau Right Slide Personnel */}
          {isUserModalOpen && (
            <>
              {/* Overlay */}
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
                onClick={() => setIsUserModalOpen(false)}
              />

              {/* Panneau Slide Right */}
              <div
                className={`fixed top-0 right-0 h-full w-1/2 ${bg('bg-slate-900', 'bg-white')} shadow-2xl z-50 transform transition-transform duration-500 ease-out`}
                style={{ transform: isUserModalOpen ? 'translateX(0)' : 'translateX(100%)' }}
              >
                {/* Header */}
                <div className={`${bg('bg-gradient-to-r from-purple-600 to-blue-600', 'bg-gradient-to-r from-purple-500 to-blue-500')} px-8 py-6 flex items-center justify-between`}>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {editingUser ? 'Modifier Personnel' : 'Nouveau Personnel'}
                    </h2>
                    <p className="text-purple-100 text-sm mt-1">
                      Gérez les informations complètes du collaborateur
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsUserModalOpen(false);
                      setUserPanelTab('general');
                    }}
                    className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>

                {/* Onglets */}
                <div className={`border-b ${cardBorderClasses} px-8`}>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setUserPanelTab('general')}
                      className={`px-6 py-4 font-semibold transition-all border-b-2 ${
                        userPanelTab === 'general'
                          ? 'border-purple-500 text-purple-500'
                          : `border-transparent ${mutedTextClasses} hover:${headingClasses}`
                      }`}
                    >
                      Informations Générales
                    </button>
                    <button
                      onClick={() => setUserPanelTab('contrat')}
                      className={`px-6 py-4 font-semibold transition-all border-b-2 ${
                        userPanelTab === 'contrat'
                          ? 'border-purple-500 text-purple-500'
                          : `border-transparent ${mutedTextClasses} hover:${headingClasses}`
                      }`}
                    >
                      Contrat
                    </button>
                    <button
                      onClick={() => setUserPanelTab('absences')}
                      className={`px-6 py-4 font-semibold transition-all border-b-2 ${
                        userPanelTab === 'absences'
                          ? 'border-purple-500 text-purple-500'
                          : `border-transparent ${mutedTextClasses} hover:${headingClasses}`
                      }`}
                    >
                      Absences
                    </button>
                    <button
                      onClick={() => setUserPanelTab('missions')}
                      className={`px-6 py-4 font-semibold transition-all border-b-2 ${
                        userPanelTab === 'missions'
                          ? 'border-purple-500 text-purple-500'
                          : `border-transparent ${mutedTextClasses} hover:${headingClasses}`
                      }`}
                    >
                      Missions
                    </button>
                  </div>
                </div>

                {/* Contenu */}
                <div className="h-[calc(100%-180px)] overflow-y-auto px-8 py-6">
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      const url = editingUser
                        ? `https://valotik-api-546691893264.europe-west1.run.app/api/users/${editingUser.id}`
                        : 'https://valotik-api-546691893264.europe-west1.run.app/api/users';

                      const method = editingUser ? 'PUT' : 'POST';

                      const response = await fetch(url, {
                        method,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(userFormData),
                      });

                      if (response.ok) {
                        const [usersResponse, statsResponse] = await Promise.all([
                          fetch('https://valotik-api-546691893264.europe-west1.run.app/api/users'),
                          fetch('https://valotik-api-546691893264.europe-west1.run.app/api/users/statistics')
                        ]);

                        if (usersResponse.ok) {
                          const usersData = await usersResponse.json();
                          setHrPersonnel(usersData.data.users || []);
                        }

                        if (statsResponse.ok) {
                          const statsData = await statsResponse.json();
                          setHrStats(statsData.data);
                        }

                        setIsUserModalOpen(false);
                        setUserPanelTab('general');
                      }
                    } catch (error) {
                      console.error('Erreur:', error);
                    }
                  }}>
                    {/* Onglet Informations Générales */}
                    {userPanelTab === 'general' && (
                      <div className="space-y-6 animate-fadeIn">
                        <div className="grid grid-cols-2 gap-6">
                          {/* Nom */}
                          <div>
                            <label className={`block text-sm font-medium ${headingClasses} mb-2`}>
                              Nom complet *
                            </label>
                            <input
                              type="text"
                              value={userFormData.nom}
                              onChange={(e) => setUserFormData({ ...userFormData, nom: e.target.value })}
                              required
                              className={`w-full px-4 py-3 ${inputClasses} border ${cardBorderClasses} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all`}
                              placeholder="Ex: Jean Dupont"
                            />
                          </div>

                          {/* Email */}
                          <div>
                            <label className={`block text-sm font-medium ${headingClasses} mb-2`}>
                              Email *
                            </label>
                            <input
                              type="email"
                              value={userFormData.email}
                              onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                              required
                              className={`w-full px-4 py-3 ${inputClasses} border ${cardBorderClasses} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all`}
                              placeholder="jean.dupont@example.com"
                            />
                          </div>

                          {/* Téléphone */}
                          <div>
                            <label className={`block text-sm font-medium ${headingClasses} mb-2`}>
                              Téléphone
                            </label>
                            <input
                              type="tel"
                              value={userFormData.telephone}
                              onChange={(e) => setUserFormData({ ...userFormData, telephone: e.target.value })}
                              className={`w-full px-4 py-3 ${inputClasses} border ${cardBorderClasses} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all`}
                              placeholder="06 12 34 56 78"
                            />
                          </div>

                          {/* Rôle */}
                          <div>
                            <label className={`block text-sm font-medium ${headingClasses} mb-2`}>
                              Rôle *
                            </label>
                            <select
                              value={userFormData.role}
                              onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                              required
                              className={`w-full px-4 py-3 ${inputClasses} border ${cardBorderClasses} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all`}
                            >
                              <option value="admin">👑 Administrateur</option>
                              <option value="planificateur">📋 Planificateur</option>
                              <option value="technicien">🔧 Technicien</option>
                              <option value="logisticien">📦 Logisticien</option>
                            </select>
                          </div>
                        </div>

                        {/* Adresse */}
                        <div>
                          <label className={`block text-sm font-medium ${headingClasses} mb-2`}>
                            Adresse complète
                          </label>
                          <input
                            type="text"
                            value={userFormData.adresse}
                            onChange={(e) => setUserFormData({ ...userFormData, adresse: e.target.value })}
                            className={`w-full px-4 py-3 ${inputClasses} border ${cardBorderClasses} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all`}
                            placeholder="15 rue de la République, 75001 Paris"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          {/* Date de naissance */}
                          <div>
                            <label className={`block text-sm font-medium ${headingClasses} mb-2`}>
                              Date de naissance
                            </label>
                            <input
                              type="date"
                              value={userFormData.dateNaissance}
                              onChange={(e) => setUserFormData({ ...userFormData, dateNaissance: e.target.value })}
                              className={`w-full px-4 py-3 ${inputClasses} border ${cardBorderClasses} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all`}
                            />
                          </div>

                          {/* Lieu de naissance */}
                          <div>
                            <label className={`block text-sm font-medium ${headingClasses} mb-2`}>
                              Lieu de naissance
                            </label>
                            <input
                              type="text"
                              value={userFormData.lieuNaissance}
                              onChange={(e) => setUserFormData({ ...userFormData, lieuNaissance: e.target.value })}
                              className={`w-full px-4 py-3 ${inputClasses} border ${cardBorderClasses} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all`}
                              placeholder="Paris"
                            />
                          </div>
                        </div>

                        {/* Numéro de sécurité sociale */}
                        <div>
                          <label className={`block text-sm font-medium ${headingClasses} mb-2`}>
                            Numéro de sécurité sociale
                          </label>
                          <input
                            type="text"
                            value={userFormData.numeroSecu}
                            onChange={(e) => setUserFormData({ ...userFormData, numeroSecu: e.target.value })}
                            className={`w-full px-4 py-3 ${inputClasses} border ${cardBorderClasses} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all`}
                            placeholder="1 89 05 75 116 123 45"
                          />
                        </div>

                        {/* Statut */}
                        <div className={`p-4 ${cardBgClasses} border ${cardBorderClasses} rounded-lg`}>
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={userFormData.actif}
                              onChange={(e) => setUserFormData({ ...userFormData, actif: e.target.checked })}
                              className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <div>
                              <span className={`text-sm font-semibold ${headingClasses}`}>Collaborateur actif</span>
                              <p className={`text-xs ${mutedTextClasses} mt-0.5`}>Ce collaborateur peut se connecter et effectuer des missions</p>
                            </div>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Onglet Contrat */}
                    {userPanelTab === 'contrat' && (
                      <div className="space-y-6 animate-fadeIn">
                        <div className="grid grid-cols-2 gap-6">
                          {/* Type de contrat */}
                          <div>
                            <label className={`block text-sm font-medium ${headingClasses} mb-2`}>
                              Type de contrat *
                            </label>
                            <select
                              value={userFormData.typeContrat}
                              onChange={(e) => setUserFormData({ ...userFormData, typeContrat: e.target.value })}
                              className={`w-full px-4 py-3 ${inputClasses} border ${cardBorderClasses} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all`}
                            >
                              <option value="CDI">CDI - Contrat à Durée Indéterminée</option>
                              <option value="CDD">CDD - Contrat à Durée Déterminée</option>
                              <option value="Interim">Intérim</option>
                              <option value="Stage">Stage</option>
                              <option value="Alternance">Alternance</option>
                              <option value="Freelance">Freelance</option>
                            </select>
                          </div>

                          {/* Poste */}
                          <div>
                            <label className={`block text-sm font-medium ${headingClasses} mb-2`}>
                              Poste / Fonction
                            </label>
                            <input
                              type="text"
                              value={userFormData.poste}
                              onChange={(e) => setUserFormData({ ...userFormData, poste: e.target.value })}
                              className={`w-full px-4 py-3 ${inputClasses} border ${cardBorderClasses} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all`}
                              placeholder="Ex: Technicien de collecte"
                            />
                          </div>

                          {/* Date de début */}
                          <div>
                            <label className={`block text-sm font-medium ${headingClasses} mb-2`}>
                              Date de début
                            </label>
                            <input
                              type="date"
                              value={userFormData.dateDebut}
                              onChange={(e) => setUserFormData({ ...userFormData, dateDebut: e.target.value })}
                              className={`w-full px-4 py-3 ${inputClasses} border ${cardBorderClasses} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all`}
                            />
                          </div>

                          {/* Date de fin */}
                          <div>
                            <label className={`block text-sm font-medium ${headingClasses} mb-2`}>
                              Date de fin {userFormData.typeContrat === 'CDD' && '*'}
                            </label>
                            <input
                              type="date"
                              value={userFormData.dateFin}
                              onChange={(e) => setUserFormData({ ...userFormData, dateFin: e.target.value })}
                              required={userFormData.typeContrat === 'CDD'}
                              disabled={userFormData.typeContrat === 'CDI'}
                              className={`w-full px-4 py-3 ${inputClasses} border ${cardBorderClasses} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${userFormData.typeContrat === 'CDI' ? 'opacity-50 cursor-not-allowed' : ''}`}
                            />
                          </div>

                          {/* Salaire brut */}
                          <div>
                            <label className={`block text-sm font-medium ${headingClasses} mb-2`}>
                              Salaire brut mensuel (€)
                            </label>
                            <input
                              type="number"
                              value={userFormData.salaireBrut}
                              onChange={(e) => setUserFormData({ ...userFormData, salaireBrut: e.target.value })}
                              className={`w-full px-4 py-3 ${inputClasses} border ${cardBorderClasses} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all`}
                              placeholder="2500"
                            />
                          </div>

                          {/* Heures hebdomadaires */}
                          <div>
                            <label className={`block text-sm font-medium ${headingClasses} mb-2`}>
                              Heures hebdomadaires
                            </label>
                            <input
                              type="number"
                              value={userFormData.heuresHebdo}
                              onChange={(e) => setUserFormData({ ...userFormData, heuresHebdo: e.target.value })}
                              className={`w-full px-4 py-3 ${inputClasses} border ${cardBorderClasses} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all`}
                              placeholder="35"
                            />
                          </div>

                          {/* Convention collective */}
                          <div>
                            <label className={`block text-sm font-medium ${headingClasses} mb-2`}>
                              Convention collective
                            </label>
                            <input
                              type="text"
                              value={userFormData.conventionCollective}
                              onChange={(e) => setUserFormData({ ...userFormData, conventionCollective: e.target.value })}
                              className={`w-full px-4 py-3 ${inputClasses} border ${cardBorderClasses} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all`}
                              placeholder="IDCC 1606 - Bricolage"
                            />
                          </div>

                          {/* Coefficient */}
                          <div>
                            <label className={`block text-sm font-medium ${headingClasses} mb-2`}>
                              Coefficient
                            </label>
                            <input
                              type="text"
                              value={userFormData.coefficient}
                              onChange={(e) => setUserFormData({ ...userFormData, coefficient: e.target.value })}
                              className={`w-full px-4 py-3 ${inputClasses} border ${cardBorderClasses} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all`}
                              placeholder="150"
                            />
                          </div>

                          {/* Classification */}
                          <div>
                            <label className={`block text-sm font-medium ${headingClasses} mb-2`}>
                              Classification
                            </label>
                            <input
                              type="text"
                              value={userFormData.classification}
                              onChange={(e) => setUserFormData({ ...userFormData, classification: e.target.value })}
                              className={`w-full px-4 py-3 ${inputClasses} border ${cardBorderClasses} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all`}
                              placeholder="Niveau II"
                            />
                          </div>

                          {/* Période d'essai */}
                          <div>
                            <label className={`block text-sm font-medium ${headingClasses} mb-2`}>
                              Période d'essai (mois)
                            </label>
                            <input
                              type="text"
                              value={userFormData.periodeEssai}
                              onChange={(e) => setUserFormData({ ...userFormData, periodeEssai: e.target.value })}
                              className={`w-full px-4 py-3 ${inputClasses} border ${cardBorderClasses} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all`}
                              placeholder="3 mois"
                            />
                          </div>

                          {/* Ancienneté */}
                          <div>
                            <label className={`block text-sm font-medium ${headingClasses} mb-2`}>
                              Ancienneté
                            </label>
                            <input
                              type="text"
                              value={userFormData.anciennete}
                              onChange={(e) => setUserFormData({ ...userFormData, anciennete: e.target.value })}
                              className={`w-full px-4 py-3 ${inputClasses} border ${cardBorderClasses} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all`}
                              placeholder="2 ans"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Onglet Absences */}
                    {userPanelTab === 'absences' && (
                      <div className="space-y-6 animate-fadeIn">
                        <div className={`${cardBgClasses} border ${cardBorderClasses} rounded-xl p-6 text-center`}>
                          <Calendar className={`w-16 h-16 ${mutedTextClasses} mx-auto mb-4`} />
                          <h3 className={`text-lg font-semibold ${headingClasses} mb-2`}>Gestion des Absences</h3>
                          <p className={`${subTextClasses} mb-6`}>
                            La gestion des absences et congés sera disponible après la création du personnel
                          </p>
                          <div className="grid grid-cols-3 gap-4 text-left">
                            <div className={`${bg('bg-blue-500/10', 'bg-blue-50')} p-4 rounded-lg`}>
                              <p className="text-2xl font-bold text-blue-500">25</p>
                              <p className={`text-sm ${mutedTextClasses}`}>Jours de congés</p>
                            </div>
                            <div className={`${bg('bg-orange-500/10', 'bg-orange-50')} p-4 rounded-lg`}>
                              <p className="text-2xl font-bold text-orange-500">5</p>
                              <p className={`text-sm ${mutedTextClasses}`}>RTT disponibles</p>
                            </div>
                            <div className={`${bg('bg-green-500/10', 'bg-green-50')} p-4 rounded-lg`}>
                              <p className="text-2xl font-bold text-green-500">0</p>
                              <p className={`text-sm ${mutedTextClasses}`}>En cours</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Onglet Missions */}
                    {userPanelTab === 'missions' && (
                      <div className="space-y-6 animate-fadeIn">
                        <div className={`${cardBgClasses} border ${cardBorderClasses} rounded-xl p-6 text-center`}>
                          <Briefcase className={`w-16 h-16 ${mutedTextClasses} mx-auto mb-4`} />
                          <h3 className={`text-lg font-semibold ${headingClasses} mb-2`}>Missions Assignées</h3>
                          <p className={`${subTextClasses} mb-6`}>
                            Les missions seront affichées ici une fois le personnel créé et des dossiers assignés
                          </p>
                          <div className="grid grid-cols-2 gap-4 text-left">
                            <div className={`${bg('bg-purple-500/10', 'bg-purple-50')} p-4 rounded-lg`}>
                              <p className="text-2xl font-bold text-purple-500">0</p>
                              <p className={`text-sm ${mutedTextClasses}`}>Missions en cours</p>
                            </div>
                            <div className={`${bg('bg-green-500/10', 'bg-green-50')} p-4 rounded-lg`}>
                              <p className="text-2xl font-bold text-green-500">0</p>
                              <p className={`text-sm ${mutedTextClasses}`}>Missions terminées</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Boutons en bas */}
                    <div className={`sticky bottom-0 left-0 right-0 mt-8 pt-6 border-t ${cardBorderClasses} bg-inherit flex gap-4`}>
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserModalOpen(false);
                          setUserPanelTab('general');
                        }}
                        className={`flex-1 px-6 py-3 ${bg('bg-slate-800 hover:bg-slate-700', 'bg-gray-200 hover:bg-gray-300')} ${headingClasses} rounded-lg font-semibold transition-colors`}
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-semibold shadow-lg transition-all"
                      >
                        {editingUser ? 'Enregistrer les modifications' : 'Créer le personnel'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Panel de Filtres par Catégorie/Sous-catégorie */}
      <>
        {/* Overlay */}
        <div
          className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${
            isFilterPanelOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setIsFilterPanelOpen(false)}
        ></div>

        {/* Panel coulissant */}
        <div
          className={`fixed top-0 right-0 h-full ${bg('bg-slate-900', 'bg-white')} shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
            isFilterPanelOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{ width: '450px' }}
        >
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className={`${bg('bg-gradient-to-r from-purple-600 via-purple-500 to-cyan-500', 'bg-gradient-to-r from-purple-600 via-purple-500 to-cyan-500')} p-6`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
                    <Filter className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Filtres Avancés</h2>
                    <p className="text-sm text-white/80 mt-1">
                      Filtrer par catégorie et sous-catégorie
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsFilterPanelOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className={`flex-1 overflow-y-auto p-6 ${isDark ? 'custom-scrollbar-dark' : 'custom-scrollbar-light'}`}>
              <div className="space-y-6">
                {/* Catégorie */}
                <div>
                  <label className={`block text-sm font-medium ${headingClasses} mb-2`}>
                    Catégorie
                  </label>
                  <select
                    value={filterCategoryId}
                    onChange={(e) => setFilterCategoryId(e.target.value)}
                    className={`w-full ${bg('bg-slate-800', 'bg-gray-100')} ${border('border-slate-700', 'border-gray-300')} border rounded-lg px-4 py-3 ${text('text-white', 'text-gray-900')} focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all`}
                  >
                    <option value="">Toutes les catégories</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.nom}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sous-catégorie */}
                <div>
                  <label className={`block text-sm font-medium ${headingClasses} mb-2`}>
                    Sous-catégorie
                  </label>
                  <select
                    value={filterSubCategoryId}
                    onChange={(e) => setFilterSubCategoryId(e.target.value)}
                    disabled={!filterCategoryId}
                    className={`w-full ${bg('bg-slate-800', 'bg-gray-100')} ${border('border-slate-700', 'border-gray-300')} border rounded-lg px-4 py-3 ${text('text-white', 'text-gray-900')} focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${!filterCategoryId ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <option value="">Toutes les sous-catégories</option>
                    {filterAvailableSubCategories.map((subCategory) => (
                      <option key={subCategory.id} value={subCategory.id}>
                        {subCategory.nom}
                      </option>
                    ))}
                  </select>
                  {!filterCategoryId && (
                    <p className={`text-xs ${subTextClasses} mt-2`}>
                      Sélectionnez d'abord une catégorie
                    </p>
                  )}
                </div>

                {/* Résumé des filtres actifs */}
                {(filterCategoryId || filterSubCategoryId) && (
                  <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-xl p-4`}>
                    <h3 className={`text-sm font-semibold ${headingClasses} mb-3 flex items-center gap-2`}>
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      Filtres actifs
                    </h3>
                    <div className="space-y-2">
                      {filterCategoryId && (
                        <div className="flex items-center justify-between">
                          <span className={`text-sm ${text('text-slate-300', 'text-gray-700')}`}>
                            Catégorie: <span className="font-medium">{categories.find(c => c.id === filterCategoryId)?.nom}</span>
                          </span>
                          <button
                            onClick={() => {
                              setFilterCategoryId('');
                              setFilterSubCategoryId('');
                            }}
                            className={`text-xs ${text('text-slate-400 hover:text-red-400', 'text-gray-500 hover:text-red-500')} transition-colors`}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      {filterSubCategoryId && (
                        <div className="flex items-center justify-between">
                          <span className={`text-sm ${text('text-slate-300', 'text-gray-700')}`}>
                            Sous-catégorie: <span className="font-medium">{filterAvailableSubCategories.find(sc => sc.id === filterSubCategoryId)?.nom}</span>
                          </span>
                          <button
                            onClick={() => setFilterSubCategoryId('')}
                            className={`text-xs ${text('text-slate-400 hover:text-red-400', 'text-gray-500 hover:text-red-500')} transition-colors`}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className={`${bg('bg-slate-800', 'bg-gray-50')} ${border('border-t-slate-700', 'border-t-gray-200')} border-t p-6`}>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setFilterCategoryId('');
                    setFilterSubCategoryId('');
                  }}
                  className={`flex-1 px-6 py-3 rounded-lg ${bg('bg-slate-700', 'bg-gray-200')} ${text('text-slate-300', 'text-gray-700')} hover:${bg('bg-slate-600', 'bg-gray-300')} transition-colors font-medium`}
                >
                  Réinitialiser
                </button>
                <button
                  onClick={() => setIsFilterPanelOpen(false)}
                  className="flex-1 bg-gradient-to-r from-purple-600 via-purple-500 to-cyan-500 hover:from-purple-700 hover:via-purple-600 hover:to-cyan-600 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50"
                >
                  Appliquer
                </button>
              </div>
            </div>
          </div>
        </div>
      </>

      {/* Modal pour ajouter un lot */}
      {isLotModalOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setIsLotModalOpen(false)}
          />

          {/* Panel */}
          <div className={`fixed top-0 right-0 h-full w-full md:w-2/3 lg:w-1/2 ${bg('bg-slate-900', 'bg-white')} shadow-2xl z-50 transform transition-transform duration-500 ease-out overflow-y-auto`}>
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center">
                <Package className="w-6 h-6 mr-2" />
                Créer un Nouveau Lot
              </h2>
              <button
                onClick={() => setIsLotModalOpen(false)}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Informations du Lot */}
              <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-lg p-4`}>
                <h3 className={`text-lg font-semibold ${headingClasses} mb-4 flex items-center`}>
                  <FileText className="w-5 h-5 mr-2 text-cyan-600" />
                  Informations du Lot
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${subTextClasses} mb-2`}>
                      Catégorie *
                    </label>
                    <select
                      value={lotFormData.categorie}
                      onChange={(e) => setLotFormData({ ...lotFormData, categorie: e.target.value })}
                      className={`w-full px-4 py-3 ${inputClasses} border ${cardBorderClasses} rounded-lg`}
                      required
                    >
                      <option value="">Sélectionner une catégorie</option>
                      <option value="ordinateurs">Ordinateurs</option>
                      <option value="serveurs">Serveurs</option>
                      <option value="ecrans">Écrans</option>
                      <option value="peripheriques">Périphériques</option>
                      <option value="reseaux">Équipements Réseau</option>
                      <option value="telephonie">Téléphonie</option>
                      <option value="autres">Autres</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${subTextClasses} mb-2`}>
                      Grade *
                    </label>
                    <select
                      value={lotFormData.grade}
                      onChange={(e) => setLotFormData({ ...lotFormData, grade: e.target.value })}
                      className={`w-full px-4 py-3 ${inputClasses} border ${cardBorderClasses} rounded-lg`}
                    >
                      <option value="A">Grade A - Excellent état</option>
                      <option value="B">Grade B - Bon état</option>
                      <option value="C">Grade C - État moyen</option>
                      <option value="D">Grade D - Pièces détachées</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${subTextClasses} mb-2`}>
                      Orientation *
                    </label>
                    <select
                      value={lotFormData.orientation}
                      onChange={(e) => setLotFormData({ ...lotFormData, orientation: e.target.value })}
                      className={`w-full px-4 py-3 ${inputClasses} border ${cardBorderClasses} rounded-lg`}
                    >
                      <option value="recyclage">Recyclage</option>
                      <option value="revente">Revente</option>
                      <option value="reconditionnement">Reconditionnement</option>
                      <option value="destruction">Destruction sécurisée</option>
                      <option value="pieces_detachees">Pièces détachées</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${subTextClasses} mb-2`}>
                      Poids Estimé (kg)
                    </label>
                    <input
                      type="number"
                      value={lotFormData.poidsEstime}
                      onChange={(e) => setLotFormData({ ...lotFormData, poidsEstime: e.target.value })}
                      placeholder="Ex: 25.5"
                      step="0.1"
                      className={`w-full px-4 py-3 ${inputClasses} border ${cardBorderClasses} rounded-lg`}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className={`block text-sm font-medium ${subTextClasses} mb-2`}>
                      Notes
                    </label>
                    <textarea
                      value={lotFormData.notes}
                      onChange={(e) => setLotFormData({ ...lotFormData, notes: e.target.value })}
                      placeholder="Notes ou observations sur ce lot..."
                      rows={3}
                      className={`w-full px-4 py-3 ${inputClasses} border ${cardBorderClasses} rounded-lg`}
                    />
                  </div>
                </div>
              </div>

              {/* Composants du Lot */}
              <div className={`${cardBgClasses} ${cardBorderClasses} border rounded-lg p-4`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-semibold ${headingClasses} flex items-center`}>
                    <Layers className="w-5 h-5 mr-2 text-purple-600" />
                    Composants ({lotComponents.length})
                  </h3>
                  <button
                    onClick={() => setIsAddingComponent(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter un Composant
                  </button>
                </div>

                {/* Liste des composants */}
                {lotComponents.length > 0 ? (
                  <div className="space-y-2 mb-4">
                    {lotComponents.map((comp, index) => (
                      <div key={index} className={`${bg('bg-slate-800', 'bg-gray-100')} rounded-lg p-3 flex items-center justify-between`}>
                        <div className="flex-1">
                          <div className={`font-medium ${headingClasses}`}>{comp.type}</div>
                          <div className={`text-sm ${subTextClasses}`}>
                            {comp.marque} {comp.modele}
                            {comp.numeroSerie && ` - S/N: ${comp.numeroSerie}`}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-1 rounded ${
                              comp.etat === 'fonctionnel' ? 'bg-emerald-500/20 text-emerald-600' :
                              comp.etat === 'defectueux' ? 'bg-red-500/20 text-red-600' :
                              'bg-orange-500/20 text-orange-600'
                            }`}>
                              {comp.etat}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => setLotComponents(lotComponents.filter((_, i) => i !== index))}
                          className="text-red-600 hover:bg-red-500/10 rounded-lg p-2 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`text-center py-8 ${subTextClasses}`}>
                    Aucun composant ajouté pour ce lot
                  </div>
                )}

                {/* Formulaire d'ajout de composant */}
                {isAddingComponent && (
                  <div className={`${bg('bg-slate-800/50', 'bg-blue-50')} border ${cardBorderClasses} rounded-lg p-4 mb-4`}>
                    <h4 className={`font-medium ${headingClasses} mb-3`}>Nouveau Composant</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-sm ${subTextClasses} mb-1`}>Type *</label>
                        <input
                          type="text"
                          value={componentFormData.type}
                          onChange={(e) => setComponentFormData({ ...componentFormData, type: e.target.value })}
                          placeholder="Ex: PC Portable, Serveur, Écran..."
                          className={`w-full px-3 py-2 text-sm ${inputClasses} border ${cardBorderClasses} rounded-lg`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm ${subTextClasses} mb-1`}>Marque</label>
                        <input
                          type="text"
                          value={componentFormData.marque}
                          onChange={(e) => setComponentFormData({ ...componentFormData, marque: e.target.value })}
                          placeholder="Ex: Dell, HP, Lenovo..."
                          className={`w-full px-3 py-2 text-sm ${inputClasses} border ${cardBorderClasses} rounded-lg`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm ${subTextClasses} mb-1`}>Modèle</label>
                        <input
                          type="text"
                          value={componentFormData.modele}
                          onChange={(e) => setComponentFormData({ ...componentFormData, modele: e.target.value })}
                          placeholder="Ex: OptiPlex 7090..."
                          className={`w-full px-3 py-2 text-sm ${inputClasses} border ${cardBorderClasses} rounded-lg`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm ${subTextClasses} mb-1`}>Numéro de Série</label>
                        <input
                          type="text"
                          value={componentFormData.numeroSerie}
                          onChange={(e) => setComponentFormData({ ...componentFormData, numeroSerie: e.target.value })}
                          placeholder="S/N..."
                          className={`w-full px-3 py-2 text-sm ${inputClasses} border ${cardBorderClasses} rounded-lg`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm ${subTextClasses} mb-1`}>État</label>
                        <select
                          value={componentFormData.etat}
                          onChange={(e) => setComponentFormData({ ...componentFormData, etat: e.target.value })}
                          className={`w-full px-3 py-2 text-sm ${inputClasses} border ${cardBorderClasses} rounded-lg`}
                        >
                          <option value="fonctionnel">Fonctionnel</option>
                          <option value="defectueux">Défectueux</option>
                          <option value="a_tester">À tester</option>
                        </select>
                      </div>
                      <div>
                        <label className={`block text-sm ${subTextClasses} mb-1`}>Notes</label>
                        <input
                          type="text"
                          value={componentFormData.notes}
                          onChange={(e) => setComponentFormData({ ...componentFormData, notes: e.target.value })}
                          placeholder="Observations..."
                          className={`w-full px-3 py-2 text-sm ${inputClasses} border ${cardBorderClasses} rounded-lg`}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => {
                          if (componentFormData.type.trim()) {
                            setLotComponents([...lotComponents, { ...componentFormData }]);
                            setComponentFormData({
                              type: '',
                              marque: '',
                              modele: '',
                              numeroSerie: '',
                              etat: 'fonctionnel',
                              notes: '',
                            });
                            setIsAddingComponent(false);
                          }
                        }}
                        className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                      >
                        Ajouter
                      </button>
                      <button
                        onClick={() => {
                          setIsAddingComponent(false);
                          setComponentFormData({
                            type: '',
                            marque: '',
                            modele: '',
                            numeroSerie: '',
                            etat: 'fonctionnel',
                            notes: '',
                          });
                        }}
                        className={`px-4 py-2 ${bg('bg-slate-700', 'bg-gray-200')} ${text('text-slate-300', 'text-gray-700')} rounded-lg hover:bg-opacity-80 transition-colors text-sm`}
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className={`sticky bottom-0 left-0 right-0 mt-8 pt-6 border-t ${cardBorderClasses} bg-inherit flex gap-4 p-6`}>
              <button
                onClick={() => {
                  setIsLotModalOpen(false);
                  setLotFormData({
                    categorie: '',
                    grade: 'A',
                    orientation: 'recyclage',
                    poidsEstime: '',
                    notes: '',
                  });
                  setLotComponents([]);
                  setIsAddingComponent(false);
                }}
                className={`flex-1 px-6 py-3 ${bg('bg-slate-700', 'bg-gray-200')} ${text('text-slate-300', 'text-gray-700')} rounded-lg hover:bg-opacity-80 transition-colors font-medium`}
              >
                Annuler
              </button>
              <button
                onClick={async () => {
                  // Validation - ne pas créer un lot vide
                  if (!lotFormData.categorie) {
                    alert('Veuillez sélectionner une catégorie');
                    return;
                  }

                  if (lotComponents.length === 0) {
                    alert('Veuillez ajouter au moins un composant au lot');
                    return;
                  }

                  if (!selectedCaseFileDetails?.id) {
                    alert('Aucun dossier sélectionné');
                    return;
                  }

                  try {
                    // Appeler l'API pour créer le lot avec les composants
                    const response = await lotsApi.create({
                      caseFileId: selectedCaseFileDetails.id,
                      lot: lotFormData,
                      components: lotComponents,
                    });

                    if (response.success) {
                      // Succès - fermer le modal et réinitialiser
                      setIsLotModalOpen(false);
                      setLotFormData({
                        categorie: '',
                        grade: 'A',
                        orientation: 'recyclage',
                        poidsEstime: '',
                        notes: '',
                      });
                      setLotComponents([]);
                      setIsAddingComponent(false);

                      // Recharger les détails du dossier pour afficher le nouveau lot
                      await loadCaseFileDetails(selectedCaseFileDetails.id);

                      // Message de succès
                      alert(response.message || 'Lot créé avec succès');
                    } else {
                      // Erreur de l'API
                      alert(response.error || 'Erreur lors de la création du lot');
                    }
                  } catch (error: any) {
                    console.error('Erreur lors de la création du lot:', error);
                    alert('Erreur lors de la création du lot');
                  }
                }}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl font-medium"
              >
                Créer le Lot
              </button>
            </div>
          </div>
        </>
      )}

      {/* Widget IA Conversation - Bouton flottant en bas à droite */}
      <AIConversationWidget />
    </>
  );
};

export default D3ECollectionApp;
