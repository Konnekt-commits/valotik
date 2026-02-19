import React, { useState, useEffect, useRef } from 'react';
import { Check, AlertCircle, Loader2, X } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';

const API_URL = 'https://valotik-api-546691893264.europe-west1.run.app/api';

const moisFR = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
const fmtDateLong = (d: string) => {
  if (!d) return '_______________';
  const dt = new Date(d);
  return `${dt.getDate()} ${moisFR[dt.getMonth()]} ${dt.getFullYear()}`;
};
const fmtDateShort = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '___/___/______';

export default function SignatureAvenantApp() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const signatureRef = useRef<SignatureCanvas>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    setToken(t);
    if (t) {
      fetchData(t);
    } else {
      setError('Lien invalide : aucun token fourni');
      setLoading(false);
    }
  }, []);

  const fetchData = async (t: string) => {
    try {
      const res = await fetch(`${API_URL}/signing/${t}`);
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
      } else {
        const json = await res.json().catch(() => null);
        if (res.status === 410) setError('Ce lien a expiré. Veuillez contacter votre employeur pour obtenir un nouveau lien.');
        else if (res.status === 409) { setError('already_signed'); }
        else setError(json?.error || 'Lien invalide');
      }
    } catch (e) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      alert('Veuillez dessiner votre signature avant de valider.');
      return;
    }
    setSigning(true);
    try {
      const sigData = signatureRef.current.toDataURL('image/png');
      const res = await fetch(`${API_URL}/signing/${token}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature: sigData })
      });
      if (res.ok) {
        setSigned(true);
      } else {
        const json = await res.json().catch(() => null);
        alert(json?.error || 'Erreur lors de la signature');
      }
    } catch (e) {
      alert('Erreur de connexion au serveur');
    } finally {
      setSigning(false);
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-300">Chargement de l'avenant...</p>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    if (error === 'already_signed') {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full text-center border border-green-500/30">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Avenant déjà signé</h1>
            <p className="text-slate-400">Cet avenant a déjà été signé. Aucune action supplémentaire n'est requise.</p>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full text-center border border-red-500/30">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Lien invalide</h1>
          <p className="text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  // Success after signing
  if (signed) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full text-center border border-green-500/30">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Signature enregistrée !</h1>
          <p className="text-slate-400">Votre signature a été enregistrée avec succès. Vous pouvez fermer cette page.</p>
        </div>
      </div>
    );
  }

  // Main view — Avenant content
  const { employee, formData: fd, organisme: org, signatureEmployeur } = data;

  const raisonSociale = org?.raisonSociale || 'VIE 59';
  const adresseOrg = org?.adresseSiege || '4120 Route de Tournai';
  const cpOrg = org?.codePostalSiege || '59500';
  const villeOrg = org?.villeSiege || 'DOUAI';
  const siretOrg = org?.siret || '90001343400031';
  const numUrssaf = fd?.numUrssaf || '3170000010240641546';
  const representantNom = org?.representantPrenom && org?.representantNom
    ? `${org.representantNom.toUpperCase()} ${org.representantPrenom}`
    : 'FELOUKI Sofiane';
  const fonction = org?.representantFonction || 'président';
  const civRepresentant = fonction?.toLowerCase().includes('présidente') || fonction?.toLowerCase().includes('directrice') ? 'Mme' : 'Mr';
  const civSalarie = employee.civilite || 'Mr';
  const nomSalarie = (employee.nom || '').toUpperCase();
  const prenomSalarie = employee.prenom || '';
  const adresseSalarie = employee.adresse || '';
  const cpSalarie = employee.codePostal || '';
  const villeSalarie = (employee.ville || '').toUpperCase();
  const nationalite = employee.nationalite || '';
  const dateNaissance = fmtDateShort(employee.dateNaissance);
  const lieuNaissance = employee.lieuNaissance || '';
  const qualif = fd?.qualification || 'ouvrier polyvalent N1P1';

  return (
    <div className="min-h-screen bg-slate-900 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-slate-800 rounded-t-2xl border border-slate-700 overflow-hidden">
          <div className="h-2 bg-orange-500" />
          <div className="p-6 text-center">
            <h1 className="text-lg font-bold text-white">Cddi : avenant de renouvellement</h1>
          </div>
        </div>

        {/* Content */}
        <div className="bg-slate-800 border-x border-slate-700 p-6 space-y-6 text-sm text-slate-300 leading-relaxed">

          {/* Entre les soussignés */}
          <div>
            <p className="font-bold text-white mb-3">Entre les soussignés :</p>
            <div className="ml-4 space-y-1">
              <p>L'ASSOCIATION <span className="font-semibold text-white">{raisonSociale.toUpperCase()}</span></p>
              <p>Dont le siège social est au {adresseOrg}, {cpOrg} {villeOrg}</p>
              <p>Siret : {siretOrg} ; N° URSSAF : {numUrssaf}</p>
              <p>Représentée par {civRepresentant} <span className="font-semibold text-white">{representantNom}</span>, agissant en qualité de {fonction}.</p>
            </div>
          </div>

          <p className="text-center font-bold text-white">D'une part,</p>

          <div>
            <p className="font-bold text-white">Et</p>
            <div className="mt-2 space-y-1">
              <p className="font-bold text-white">{civSalarie} {nomSalarie} {prenomSalarie}</p>
              <p>Demeurant au : <span className="font-semibold text-white">{adresseSalarie}</span></p>
              <p className="font-semibold text-white">{cpSalarie} {villeSalarie}</p>
              <p>De nationalité <span className="font-semibold text-white">{nationalite}</span></p>
              <p>Né(e) le <span className="font-semibold text-white">{dateNaissance}</span> à <span className="font-semibold text-white">{lieuNaissance}</span></p>
            </div>
          </div>

          <p className="text-center font-bold text-white">D'autre part,</p>

          {/* Corps du contrat */}
          <div className="space-y-3">
            <p>Il a été convenu et arrêté ce qui suit :</p>

            <p>
              <span className="font-bold text-white">{civSalarie} {nomSalarie} {prenomSalarie}</span> a été engagé(e) par {civRepresentant} {representantNom} dans le cadre d'un contrat unique d'insertion dans sa version d'{qualif}.
            </p>

            <p>
              Le contrat, qui a pris effet le <span className="font-bold text-white">{fmtDateLong(fd?.dateDebutInitial)}</span> et qui devait arriver à son terme le <span className="font-bold text-white">{fmtDateLong(fd?.dateFinInitial)}</span> est renouvelé le <span className="font-bold text-white">{fmtDateLong(fd?.dateDebut)}</span> pour une durée de <span className="font-bold text-white">{fd?.dureeMois || '4'} MOIS</span>, soit jusqu'au <span className="font-bold text-white">{fmtDateLong(fd?.dateFin)}</span>, conformément à l'article L. 5134-25-1 du code du travail.
            </p>

            <p>
              Durant la période de renouvellement, les conditions d'exécution et de cessation du contrat demeureront identiques à celles initialement prévues.
            </p>
          </div>

          {/* Fait en deux exemplaires */}
          <div className="pt-4">
            <p className="text-center font-bold text-white mb-3">Fait en deux exemplaires</p>
            <p>
              <span className="font-bold">A</span> {fd?.lieuSignature || 'DOUAI'}, le <span className="font-bold text-white">{fmtDateLong(new Date().toISOString().split('T')[0])}</span>
            </p>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            {/* Employer signature */}
            <div>
              <p className="font-bold text-white text-xs mb-1">Signature de l'employeur</p>
              <p className="text-xs italic text-slate-500 mb-2">Faire précéder la signature de la mention « lu et approuvé »</p>
              <div className="border border-slate-600 rounded-lg p-2 bg-slate-700/50 min-h-[100px] flex items-center justify-center">
                {signatureEmployeur ? (
                  <img src={signatureEmployeur} alt="Signature employeur" className="max-w-full max-h-[90px]" />
                ) : (
                  <p className="text-slate-500 text-xs">Non disponible</p>
                )}
              </div>
            </div>

            {/* Employee signature */}
            <div>
              <p className="font-bold text-white text-xs mb-1">Votre signature</p>
              <p className="text-xs italic text-slate-500 mb-2">Dessinez votre signature ci-dessous</p>
              <div className="border-2 border-dashed border-orange-500/50 rounded-lg overflow-hidden bg-slate-700">
                <SignatureCanvas
                  ref={signatureRef}
                  canvasProps={{
                    width: 300,
                    height: 120,
                    className: 'w-full cursor-crosshair',
                    style: { width: '100%', height: '120px' }
                  }}
                  penColor="#ffffff"
                  backgroundColor="#334155"
                />
              </div>
              <button
                type="button"
                onClick={() => signatureRef.current?.clear()}
                className="mt-1 text-xs text-slate-400 hover:text-slate-300 flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Effacer
              </button>
            </div>
          </div>
        </div>

        {/* Footer with button */}
        <div className="bg-slate-800 rounded-b-2xl border border-t-0 border-slate-700 p-6">
          <button
            onClick={handleSign}
            disabled={signing}
            className="w-full py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2 text-base"
          >
            {signing ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Envoi en cours...</>
            ) : (
              <><Check className="w-5 h-5" /> Valider ma signature</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
