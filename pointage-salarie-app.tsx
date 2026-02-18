import React, { useState, useEffect, useRef } from 'react';
import { User, Sun, Moon, Check, AlertCircle, Loader2, RefreshCw, X, ChevronLeft, ChevronRight } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';

const API_URL = 'https://valotik-api-546691893264.europe-west1.run.app/api/pointage';

interface EmployeeInfo {
  civilite: string;
  nom: string;
  prenom: string;
  poste: string;
  photoUrl?: string;
  dureeHebdo: number;
}

interface JourInfo {
  jour: number;
  dateStr: string;
  nomJour: string;
  estWeekend: boolean;
  estAujourdhui: boolean;
  pointage: {
    heuresMatin: number;
    heuresApresmidi: number;
    heuresTravaillees: number;
    signatureMatin: boolean;
    signatureApresmidi: boolean;
  } | null;
}

interface MobileData {
  employee: EmployeeInfo;
  mois: number;
  annee: number;
  jourAujourdhui: number;
  joursMois: JourInfo[];
  pointageMensuelId: string;
  totalHeures: number;
  heuresContrat: number;
}

const moisNoms = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export default function PointageSalarieApp() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MobileData | null>(null);
  const [selectedDay, setSelectedDay] = useState<JourInfo | null>(null);
  const [signingPeriod, setSigningPeriod] = useState<'matin' | 'apresmidi' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const signatureRef = useRef<SignatureCanvas>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    if (t) {
      setToken(t);
    } else {
      setError('Lien invalide - token manquant');
      setLoading(false);
    }
  }, []);

  const loadData = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(API_URL + '/mobile/' + token);
      const result = await res.json();

      if (!res.ok || !result.success) {
        setError(result.error || 'Erreur lors du chargement');
        return;
      }

      setData(result.data);

      // Sélectionner le jour d'aujourd'hui par défaut
      const aujourdhui = result.data.joursMois.find((j: JourInfo) => j.estAujourdhui);
      if (aujourdhui) {
        setSelectedDay(aujourdhui);
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  // Clear signature when opening bottom sheet
  useEffect(() => {
    if (signingPeriod && signatureRef.current) {
      signatureRef.current.clear();
    }
  }, [signingPeriod]);

  const signer = async () => {
    if (!signingPeriod || !selectedDay || !signatureRef.current || signatureRef.current.isEmpty()) {
      setNotification({ type: 'error', message: 'Veuillez signer avant de valider' });
      return;
    }

    setSubmitting(true);

    try {
      const signature = signatureRef.current.toDataURL('image/png');

      const res = await fetch(API_URL + '/mobile/' + token + '/signer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periode: signingPeriod,
          signature,
          date: selectedDay.dateStr
        })
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        setNotification({ type: 'error', message: result.error || 'Erreur lors de la signature' });
        return;
      }

      setNotification({ type: 'success', message: result.message });
      setSigningPeriod(null);
      await loadData();

      // Mettre à jour le jour sélectionné avec les nouvelles données
      if (data) {
        const updatedDay = data.joursMois.find(j => j.dateStr === selectedDay.dateStr);
        if (updatedDay) {
          setSelectedDay(updatedDay);
        }
      }
    } catch (err) {
      console.error('Erreur:', err);
      setNotification({ type: 'error', message: 'Erreur de connexion' });
    } finally {
      setSubmitting(false);
    }
  };

  const clearSignature = () => {
    signatureRef.current?.clear();
  };

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Mise à jour du jour sélectionné quand les données changent
  useEffect(() => {
    if (data && selectedDay) {
      const updated = data.joursMois.find(j => j.dateStr === selectedDay.dateStr);
      if (updated) {
        setSelectedDay(updated);
      }
    }
  }, [data]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-2xl p-8 text-center max-w-sm w-full">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Erreur</h1>
          <p className="text-slate-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center text-slate-400">
          Aucune donnée disponible
        </div>
      </div>
    );
  }

  const { employee, mois, annee, joursMois, totalHeures, heuresContrat } = data;

  return (
    <div className="min-h-screen bg-slate-900 pb-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 pb-6">
        <div className="flex items-center gap-3">
          {employee.photoUrl ? (
            <img
              src={employee.photoUrl}
              alt={employee.prenom + ' ' + employee.nom}
              className="w-12 h-12 rounded-full object-cover border-2 border-white/30"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">
              {employee.prenom} {employee.nom}
            </h1>
            <p className="text-white/70 text-sm">{employee.poste || 'Salarié'}</p>
          </div>
          <button
            onClick={loadData}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
          >
            <RefreshCw className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Mois en cours */}
      <div className="px-4 -mt-3">
        <div className="bg-slate-800 rounded-2xl p-4 shadow-xl mb-4">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold text-white">{moisNoms[mois]} {annee}</h2>
            <p className="text-slate-400 text-sm mt-1">
              {totalHeures}h / {heuresContrat}h
            </p>
          </div>

          {/* Grille des jours */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((j, i) => (
              <div key={i} className="text-xs text-slate-500 font-medium py-1">
                {j}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {/* Espaces vides pour aligner le premier jour */}
            {(() => {
              const premierJour = new Date(annee, mois - 1, 1).getDay();
              const offset = premierJour === 0 ? 6 : premierJour - 1;
              return Array(offset).fill(null).map((_, i) => (
                <div key={'empty-' + i} className="aspect-square" />
              ));
            })()}

            {/* Jours du mois */}
            {joursMois.map((jour) => {
              const isSelected = selectedDay?.dateStr === jour.dateStr;
              const matinOk = jour.pointage?.signatureMatin;
              const apremOk = jour.pointage?.signatureApresmidi;
              const complet = matinOk && apremOk;
              const partiel = (matinOk || apremOk) && !complet;

              return (
                <button
                  key={jour.dateStr}
                  onClick={() => !jour.estWeekend && setSelectedDay(jour)}
                  disabled={jour.estWeekend}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all relative
                    ${jour.estWeekend ? 'bg-slate-700/30 text-slate-600' : 'bg-slate-700 hover:bg-slate-600'}
                    ${isSelected ? 'ring-2 ring-blue-500 bg-blue-500/20' : ''}
                    ${jour.estAujourdhui && !isSelected ? 'ring-2 ring-orange-500' : ''}
                    ${complet ? 'bg-green-500/30' : ''}
                    ${partiel ? 'bg-yellow-500/30' : ''}
                  `}
                >
                  <span className={`font-medium ${jour.estWeekend ? 'text-slate-600' : 'text-white'}`}>
                    {jour.jour}
                  </span>
                  {!jour.estWeekend && (
                    <div className="flex gap-0.5 mt-0.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${matinOk ? 'bg-green-500' : 'bg-slate-500'}`} />
                      <div className={`w-1.5 h-1.5 rounded-full ${apremOk ? 'bg-green-500' : 'bg-slate-500'}`} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div className={'mb-4 p-4 rounded-xl flex items-center gap-3 ' + (notification.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400')}>
            {notification.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Jour sélectionné */}
        {selectedDay && !selectedDay.estWeekend && (
          <div className="bg-slate-800 rounded-2xl p-4 space-y-3">
            <div className="text-center pb-2 border-b border-slate-700">
              <p className="text-slate-400 text-sm">{selectedDay.nomJour}</p>
              <p className="text-2xl font-bold text-white">{selectedDay.jour} {moisNoms[mois]}</p>
            </div>

            {/* Bouton Matin */}
            <button
              onClick={() => !selectedDay.pointage?.signatureMatin && setSigningPeriod('matin')}
              disabled={selectedDay.pointage?.signatureMatin}
              className={'w-full p-4 rounded-xl transition-all flex items-center gap-3 ' +
                (selectedDay.pointage?.signatureMatin
                  ? 'bg-green-500/20 border border-green-500/50'
                  : 'bg-slate-700 border border-slate-600 active:scale-98')}
            >
              <div className={'w-12 h-12 rounded-xl flex items-center justify-center ' +
                (selectedDay.pointage?.signatureMatin ? 'bg-green-500' : 'bg-orange-500')}>
                <Sun className="w-6 h-6 text-white" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-semibold text-white">Matin</h3>
                {selectedDay.pointage?.signatureMatin ? (
                  <p className="text-green-400 text-sm flex items-center gap-1">
                    <Check className="w-4 h-4" /> Signé - {selectedDay.pointage.heuresMatin}h
                  </p>
                ) : (
                  <p className="text-slate-400 text-sm">Toucher pour signer</p>
                )}
              </div>
              {selectedDay.pointage?.signatureMatin && <Check className="w-6 h-6 text-green-500" />}
            </button>

            {/* Bouton Après-midi */}
            <button
              onClick={() => !selectedDay.pointage?.signatureApresmidi && setSigningPeriod('apresmidi')}
              disabled={selectedDay.pointage?.signatureApresmidi}
              className={'w-full p-4 rounded-xl transition-all flex items-center gap-3 ' +
                (selectedDay.pointage?.signatureApresmidi
                  ? 'bg-green-500/20 border border-green-500/50'
                  : 'bg-slate-700 border border-slate-600 active:scale-98')}
            >
              <div className={'w-12 h-12 rounded-xl flex items-center justify-center ' +
                (selectedDay.pointage?.signatureApresmidi ? 'bg-green-500' : 'bg-indigo-500')}>
                <Moon className="w-6 h-6 text-white" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-semibold text-white">Après-midi</h3>
                {selectedDay.pointage?.signatureApresmidi ? (
                  <p className="text-green-400 text-sm flex items-center gap-1">
                    <Check className="w-4 h-4" /> Signé - {selectedDay.pointage.heuresApresmidi}h
                  </p>
                ) : (
                  <p className="text-slate-400 text-sm">Toucher pour signer</p>
                )}
              </div>
              {selectedDay.pointage?.signatureApresmidi && <Check className="w-6 h-6 text-green-500" />}
            </button>

            {/* Total du jour */}
            {selectedDay.pointage && selectedDay.pointage.heuresTravaillees > 0 && (
              <div className="bg-slate-700 rounded-xl p-3 text-center">
                <p className="text-slate-400 text-xs">Total du jour</p>
                <p className="text-xl font-bold text-white">{selectedDay.pointage.heuresTravaillees}h</p>
              </div>
            )}
          </div>
        )}

        {/* Message weekend */}
        {selectedDay && selectedDay.estWeekend && (
          <div className="bg-slate-800 rounded-2xl p-6 text-center">
            <p className="text-orange-400 font-medium">Weekend - Pas de pointage</p>
          </div>
        )}
      </div>

      {/* Bottom Sheet pour la signature */}
      {signingPeriod && selectedDay && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 z-40 transition-opacity"
            onClick={() => setSigningPeriod(null)}
          />

          {/* Bottom Sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
            <div className="bg-slate-800 rounded-t-3xl shadow-2xl">
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1.5 bg-slate-600 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-6 pb-4">
                <div className="flex items-center gap-3">
                  {signingPeriod === 'matin' ? (
                    <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center">
                      <Sun className="w-6 h-6 text-white" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-indigo-500 flex items-center justify-center">
                      <Moon className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {signingPeriod === 'matin' ? 'Matin' : 'Après-midi'}
                    </h2>
                    <p className="text-slate-400 text-sm">
                      {selectedDay.nomJour} {selectedDay.jour} {moisNoms[mois]}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSigningPeriod(null)}
                  className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center hover:bg-slate-600 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Signature Canvas */}
              <div className="px-6 pb-4">
                <div className="bg-white rounded-2xl overflow-hidden shadow-inner">
                  <SignatureCanvas
                    ref={signatureRef}
                    canvasProps={{
                      className: 'w-full',
                      style: { width: '100%', height: '200px', touchAction: 'none' }
                    }}
                    backgroundColor="white"
                    penColor="black"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 pb-6 space-y-3">
                <div className="flex gap-3">
                  <button
                    onClick={clearSignature}
                    className="flex-1 py-3 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-600 transition-colors"
                  >
                    Effacer
                  </button>
                </div>

                <button
                  onClick={signer}
                  disabled={submitting}
                  className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Valider la signature
                    </>
                  )}
                </button>
              </div>

              {/* Safe area for iOS */}
              <div className="h-6 bg-slate-800" />
            </div>
          </div>
        </>
      )}

      {/* CSS Animation */}
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
