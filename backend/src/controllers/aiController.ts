import { Request, Response } from 'express';
import prisma from '../config/database';
import { ApiResponse } from '../types';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = 'gpt-4o';

export class AIController {
  // Analyser une conversation avec OpenAI
  async analyzeConversation(req: Request, res: Response): Promise<void> {
    try {
      const { transcript, prompt } = req.body;

      if (!transcript || !prompt) {
        const response: ApiResponse = {
          success: false,
          error: 'Transcript et prompt requis'
        };
        res.status(400).json(response);
        return;
      }

      if (!OPENAI_API_KEY) {
        const response: ApiResponse = {
          success: false,
          error: 'Clé API OpenAI non configurée'
        };
        res.status(500).json(response);
        return;
      }

      const apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [
            { role: "system", content: "Expert extraction. JSON uniquement." },
            { role: "user", content: prompt }
          ],
          temperature: 0.05,
          max_tokens: 1200
        })
      });

      const data = await apiResponse.json();

      if (!apiResponse.ok) {
        throw new Error(data.error?.message || 'Erreur API OpenAI');
      }

      const aiResponse = data.choices[0].message.content.trim();
      const cleanedResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const extractedData = JSON.parse(cleanedResponse);

      const response: ApiResponse = {
        success: true,
        data: extractedData
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error analyzing conversation:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Erreur lors de l\'analyse de la conversation'
      };
      res.status(500).json(response);
    }
  }

  // Créer une demande à partir des données extraites
  async createPickupFromConversation(req: Request, res: Response): Promise<void> {
    try {
      const { contact, entreprise, contexte } = req.body;

      if (!contact || !entreprise) {
        const response: ApiResponse = {
          success: false,
          error: 'Données de contact et entreprise requises'
        };
        res.status(400).json(response);
        return;
      }

      // 1. Créer ou trouver le client
      let client = await prisma.clientCompany.findFirst({
        where: {
          raisonSociale: entreprise.nom
        }
      });

      if (!client) {
        client = await prisma.clientCompany.create({
          data: {
            raisonSociale: entreprise.nom,
            adresseFacturation: entreprise.adresse || entreprise.ville || 'À compléter',
            secteur: 'D3E Collection',
          }
        });
      }

      // 2. Créer le site
      const site = await prisma.clientSite.create({
        data: {
          clientId: client.id,
          nom: `Site ${entreprise.ville || 'Principal'}`,
          adresseComplete: entreprise.adresse || entreprise.ville || 'À compléter',
          typeSite: 'bureau',
        }
      });

      // 3. Créer le contact
      const contactRecord = await prisma.contact.create({
        data: {
          clientId: client.id,
          nom: `${contact.prenom || ''} ${contact.nom || ''}`.trim() || 'Contact',
          fonction: contact.fonction || 'Non spécifié',
          telephone: contact.telephone || 'À compléter',
          email: contact.email || 'À compléter',
        }
      });

      // 4. Créer la demande d'enlèvement
      const pickupRequest = await prisma.pickupRequest.create({
        data: {
          clientId: client.id,
          siteId: site.id,
          contactId: contactRecord.id,
          descriptionInitiale: contexte?.notes || `Demande créée via conversation IA - Matériel: ${contexte?.type_materiel || 'Non spécifié'}`,
          categoriePrincipale: contexte?.type_materiel || 'Équipements informatiques',
          volumeEstime: contexte?.quantite || 'À estimer',
          priorite: 'medium',
          statut: 'diagnostic_pending',
          plannedVisitAt: contexte?.date_rdv ? new Date(contexte.date_rdv) : null,
        }
      });

      // 5. Créer le dossier (CaseFile)
      const caseFile = await prisma.caseFile.create({
        data: {
          requestId: pickupRequest.id,
          clientId: client.id,
          reference: `DOSSIER-${Date.now()}`,
          statut: 'diagnostic_pending',
        }
      });

      // Log d'audit
      await prisma.auditLog.create({
        data: {
          entite: 'PickupRequest',
          entiteId: pickupRequest.id,
          action: 'CREATE_FROM_AI',
          payload: JSON.stringify({
            contact,
            entreprise,
            contexte,
          }),
        }
      });

      const response: ApiResponse = {
        success: true,
        data: {
          clientId: client.id,
          siteId: site.id,
          contactId: contactRecord.id,
          pickupRequestId: pickupRequest.id,
          caseFileId: caseFile.id,
        },
        message: 'Demande créée avec succès depuis la conversation IA'
      };

      res.status(201).json(response);
    } catch (error: any) {
      console.error('Error creating pickup from conversation:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Erreur lors de la création de la demande'
      };
      res.status(500).json(response);
    }
  }
}

export default new AIController();
