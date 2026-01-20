import React, { useState, useEffect, useRef } from 'react';
import { Mic, Sparkles, Trash2, Save, AlertCircle, CheckCircle2, FileText } from 'lucide-react';

interface ExtractedContact {
  prenom: string;
  nom: string;
  fonction: string;
  telephone: string;
  email: string;
}

interface ExtractedEntreprise {
  nom: string;
  ville: string;
  adresse: string;
}

interface ExtractedContexte {
  type_materiel: string;
  quantite: string;
  date_rdv: string;
  notes: string;
}

interface ExtractedData {
  found: boolean;
  contact: ExtractedContact;
  entreprise: ExtractedEntreprise;
  contexte: ExtractedContexte;
}

const AIConversationAnalyzer = () => {
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [transcriptLines, setTranscriptLines] = useState<string[]>([]);
  const [interimText, setInterimText] = useState('');
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const recognitionRef = useRef<any>(null);
  const conversationBufferRef = useRef<string[]>([]);
  const transcriptAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      showMessage('Reconnaissance vocale non supportée par ce navigateur', 'error');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('🎙️ Reconnaissance vocale démarrée');
      showMessage('Microphone activé - Parlez maintenant', 'success');
    };

    recognition.onresult = (event: any) => {
      console.log('📝 Résultat reçu:', event);
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        console.log(`Transcription [${i}]:`, transcript, 'Final:', event.results[i].isFinal);

        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        console.log('✅ Texte final:', finalTranscript);
        setTranscriptLines(prev => [...prev, finalTranscript.trim()]);
        conversationBufferRef.current.push(finalTranscript.trim());
      }

      if (interimTranscript) {
        console.log('⏳ Texte intermédiaire:', interimTranscript);
      }

      setInterimText(interimTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error('❌ Erreur reconnaissance vocale:', event.error, event);
      if (event.error === 'not-allowed') {
        showMessage('Accès au microphone refusé', 'error');
        stopListening();
      } else if (event.error === 'no-speech') {
        console.log('⚠️ Aucune parole détectée - Continuez de parler');
        // Ne pas arrêter sur no-speech, juste continuer
        // La reconnaissance va redémarrer automatiquement
      } else if (event.error === 'audio-capture') {
        showMessage('Erreur microphone - Vérifiez vos paramètres', 'error');
        stopListening();
      } else if (event.error === 'network') {
        showMessage('Erreur réseau - Vérifiez votre connexion', 'error');
      } else if (event.error === 'aborted') {
        console.log('⚠️ Reconnaissance interrompue');
        // Normal, ne rien faire
      } else {
        console.warn(`⚠️ Erreur: ${event.error}`);
      }
    };

    recognition.onend = () => {
      console.log('🛑 Reconnaissance vocale arrêtée');
      if (isListening) {
        console.log('🔄 Redémarrage automatique...');
        setTimeout(() => {
          if (isListening) {
            try {
              recognition.start();
              console.log('✅ Redémarrage réussi');
            } catch (e) {
              console.error('❌ Erreur redémarrage:', e);
            }
          }
        }, 300);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, [isListening]);

  useEffect(() => {
    if (transcriptAreaRef.current) {
      transcriptAreaRef.current.scrollTop = transcriptAreaRef.current.scrollHeight;
    }
  }, [transcriptLines, interimText]);

  const startListening = () => {
    try {
      recognitionRef.current.start();
      setIsListening(true);
      setTranscriptLines([]);
      conversationBufferRef.current = [];
      setExtractedData(null);
    } catch (e) {
      showMessage('Erreur lors du démarrage du microphone', 'error');
    }
  };

  const stopListening = () => {
    try {
      recognitionRef.current.stop();
      setIsListening(false);
      setInterimText('');
    } catch (e) {}
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const analyzeConversation = async () => {
    const fullText = conversationBufferRef.current.join(' ');

    if (!fullText || fullText.length === 0) {
      showMessage('Aucune conversation à analyser', 'error');
      return;
    }

    if (isListening) stopListening();

    setIsAnalyzing(true);

    const prompt = `Tu es un expert en extraction d'informations depuis des conversations téléphoniques B2B.

CONVERSATION :
"""
${fullText}
"""

Extrais UN SEUL contact avec TOUTES les infos disponibles :
- Prénom/Nom
- Téléphone
- Email
- Fonction
- Entreprise + Ville + Adresse complète
- Type de matériel (équipements informatiques, serveurs, etc.)
- Quantité estimée
- Date de RDV si mentionnée
- Notes importantes

Réponds uniquement avec ce JSON (sans markdown) :
{
  "found": true,
  "contact": {"prenom": "", "nom": "", "fonction": "", "telephone": "", "email": ""},
  "entreprise": {"nom": "", "ville": "", "adresse": ""},
  "contexte": {"type_materiel": "", "quantite": "", "date_rdv": "", "notes": ""}
}`;

    try {
      const response = await fetch('http://localhost:5000/api/ai/analyze-conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript: fullText, prompt }),
      });

      const data = await response.json();

      if (data.success && data.data.found) {
        setExtractedData(data.data);
        showMessage('Informations extraites avec succès', 'success');
      } else {
        showMessage('Aucune information exploitable trouvée', 'error');
      }
    } catch (error) {
      console.error('Error analyzing conversation:', error);
      showMessage('Erreur lors de l\'analyse', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const createPickupRequest = async () => {
    if (!extractedData) return;

    setIsSaving(true);

    try {
      const response = await fetch('http://localhost:5000/api/ai/create-pickup-from-conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(extractedData),
      });

      const data = await response.json();

      if (data.success) {
        showMessage('Demande créée avec succès !', 'success');

        // Attendre 1 seconde pour que l'utilisateur voie le message de succès
        setTimeout(() => {
          // Recharger la page pour afficher la nouvelle demande en haut de la liste
          window.location.reload();
        }, 1000);
      } else {
        showMessage(`Erreur: ${data.error}`, 'error');
      }
    } catch (error) {
      console.error('Error creating pickup request:', error);
      showMessage('Erreur lors de la création de la demande', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const clearSession = () => {
    setTranscriptLines([]);
    setInterimText('');
    conversationBufferRef.current = [];
    setExtractedData(null);
    showMessage('Session effacée', 'success');
  };

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              ValoTik Tak - Analyse IA
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Enregistrez une conversation et laissez l'IA créer automatiquement la demande
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={toggleListening}
              className={`p-4 rounded-full transition-all duration-300 ${
                isListening
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/50 animate-pulse'
                  : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-2 border-slate-200 dark:border-slate-700'
              }`}
              title={isListening ? 'Arrêter l\'écoute' : 'Démarrer l\'écoute'}
            >
              <Mic className="w-6 h-6" />
            </button>

            {/* Bouton Analyse - Toujours visible */}
            <button
              onClick={analyzeConversation}
              disabled={isAnalyzing || (transcriptLines.length === 0 && conversationBufferRef.current.length === 0)}
              className={`p-4 rounded-full transition-all duration-300 shadow-lg ${
                isAnalyzing || (transcriptLines.length === 0 && conversationBufferRef.current.length === 0)
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
              title="Analyser avec l'IA"
            >
              {isAnalyzing ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-6 h-6 text-white" />
              )}
            </button>

            {/* Bouton Test - Ajoute du texte de démonstration */}
            {transcriptLines.length === 0 && (
              <button
                onClick={() => {
                  const testText = "Bonjour, je m'appelle Marie Dupont, je suis responsable IT chez TechCorp à Lyon. Nous avons une quarantaine de PC portables à recycler. Mon numéro c'est le 06 12 34 56 78 et mon email marie.dupont@techcorp.fr. On pourrait se voir mardi prochain ?";
                  setTranscriptLines([testText]);
                  conversationBufferRef.current = [testText];
                  showMessage('Texte de test ajouté', 'success');
                }}
                className="p-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 shadow-lg"
                title="Ajouter texte de test"
              >
                <FileText className="w-6 h-6" />
              </button>
            )}

            <button
              onClick={clearSession}
              className="p-4 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-2 border-slate-200 dark:border-slate-700 transition-all duration-300"
              title="Effacer la session"
            >
              <Trash2 className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className="max-w-6xl mx-auto mb-4">
          <div className={`flex items-center gap-3 p-4 rounded-xl border-2 ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Transcript Area */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Transcription
            </h2>
            {isListening && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-red-600 dark:text-red-400 animate-pulse">
                  ● ÉCOUTE EN COURS
                </span>
                <div className="flex gap-1">
                  <div className="w-1 h-4 bg-red-500 rounded animate-pulse" style={{ animationDelay: '0s' }}></div>
                  <div className="w-1 h-6 bg-red-500 rounded animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-1 h-8 bg-red-500 rounded animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  <div className="w-1 h-6 bg-red-500 rounded animate-pulse" style={{ animationDelay: '0.6s' }}></div>
                  <div className="w-1 h-4 bg-red-500 rounded animate-pulse" style={{ animationDelay: '0.8s' }}></div>
                </div>
              </div>
            )}
          </div>

          <div
            ref={transcriptAreaRef}
            className="h-[600px] overflow-y-auto space-y-3 pr-2"
          >
            {transcriptLines.length === 0 && !interimText ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500">
                <div className="text-6xl mb-4 opacity-20">{isListening ? '🎙️' : '○'}</div>
                {isListening ? (
                  <div className="text-center space-y-2">
                    <p className="text-sm font-semibold text-red-500 animate-pulse">En écoute...</p>
                    <p className="text-xs">Parlez maintenant clairement dans votre microphone</p>
                    <p className="text-xs">La transcription apparaîtra ici</p>
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <p className="text-sm">Prêt à enregistrer</p>
                    <p className="text-xs">Cliquez sur 🎙️ pour commencer</p>
                  </div>
                )}
              </div>
            ) : (
              <>
                {transcriptLines.map((line, index) => (
                  <div
                    key={index}
                    className="p-4 bg-slate-50 dark:bg-slate-900 border-l-2 border-blue-500 rounded-lg text-slate-900 dark:text-slate-100 animate-in fade-in duration-300"
                  >
                    {line}
                  </div>
                ))}

                {interimText && (
                  <div className="p-4 border-l-2 border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 italic">
                    {interimText}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Extracted Data */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Données extraites
            </h2>
            {extractedData && (
              <button
                onClick={createPickupRequest}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Créer la demande
                  </>
                )}
              </button>
            )}
          </div>

          <div className="h-[600px] overflow-y-auto">
            {!extractedData ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500">
                <Sparkles className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm text-center">
                  Aucune donnée extraite.<br />
                  Analysez la conversation pour commencer.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Contact */}
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
                    {extractedData.contact.prenom} {extractedData.contact.nom}
                  </h3>

                  <div className="space-y-2 text-sm">
                    {extractedData.contact.fonction && (
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-slate-500 dark:text-slate-400">Fonction</span>
                        <span className="col-span-2 text-slate-900 dark:text-slate-100">{extractedData.contact.fonction}</span>
                      </div>
                    )}
                    {extractedData.contact.telephone && (
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-slate-500 dark:text-slate-400">Téléphone</span>
                        <span className="col-span-2 text-slate-900 dark:text-slate-100">{extractedData.contact.telephone}</span>
                      </div>
                    )}
                    {extractedData.contact.email && (
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-slate-500 dark:text-slate-400">Email</span>
                        <span className="col-span-2 text-slate-900 dark:text-slate-100">{extractedData.contact.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Entreprise */}
                {(extractedData.entreprise.nom || extractedData.entreprise.ville || extractedData.entreprise.adresse) && (
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
                      Entreprise
                    </h3>

                    <div className="space-y-2 text-sm">
                      {extractedData.entreprise.nom && (
                        <div className="grid grid-cols-3 gap-2">
                          <span className="text-slate-500 dark:text-slate-400">Nom</span>
                          <span className="col-span-2 text-slate-900 dark:text-slate-100">{extractedData.entreprise.nom}</span>
                        </div>
                      )}
                      {extractedData.entreprise.ville && (
                        <div className="grid grid-cols-3 gap-2">
                          <span className="text-slate-500 dark:text-slate-400">Ville</span>
                          <span className="col-span-2 text-slate-900 dark:text-slate-100">{extractedData.entreprise.ville}</span>
                        </div>
                      )}
                      {extractedData.entreprise.adresse && (
                        <div className="grid grid-cols-3 gap-2">
                          <span className="text-slate-500 dark:text-slate-400">Adresse</span>
                          <span className="col-span-2 text-slate-900 dark:text-slate-100">{extractedData.entreprise.adresse}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Contexte */}
                {(extractedData.contexte.type_materiel || extractedData.contexte.quantite || extractedData.contexte.date_rdv || extractedData.contexte.notes) && (
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
                      Contexte
                    </h3>

                    <div className="space-y-2 text-sm">
                      {extractedData.contexte.type_materiel && (
                        <div className="grid grid-cols-3 gap-2">
                          <span className="text-slate-500 dark:text-slate-400">Matériel</span>
                          <span className="col-span-2 text-slate-900 dark:text-slate-100">{extractedData.contexte.type_materiel}</span>
                        </div>
                      )}
                      {extractedData.contexte.quantite && (
                        <div className="grid grid-cols-3 gap-2">
                          <span className="text-slate-500 dark:text-slate-400">Quantité</span>
                          <span className="col-span-2 text-slate-900 dark:text-slate-100">{extractedData.contexte.quantite}</span>
                        </div>
                      )}
                      {extractedData.contexte.date_rdv && (
                        <div className="grid grid-cols-3 gap-2">
                          <span className="text-slate-500 dark:text-slate-400">Date RDV</span>
                          <span className="col-span-2 text-slate-900 dark:text-slate-100">{extractedData.contexte.date_rdv}</span>
                        </div>
                      )}
                      {extractedData.contexte.notes && (
                        <div className="grid grid-cols-3 gap-2">
                          <span className="text-slate-500 dark:text-slate-400">Notes</span>
                          <span className="col-span-2 text-slate-900 dark:text-slate-100">{extractedData.contexte.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      {isAnalyzing && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2">
          <div className="bg-purple-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span className="text-sm font-medium">Analyse en cours...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIConversationAnalyzer;
