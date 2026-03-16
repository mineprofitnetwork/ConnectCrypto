/**
 * @fileOverview An AI assistant for agents to generate recruitment and communication messages.
 */

import {z} from 'zod';

const AgentAICommunicationAssistantInputSchema = z.object({
  messageType: z
    .enum(['recruitment', 'onboarding', 'support'])
    .describe('The type of message to generate: recruitment of new traders, onboarding of new referrals, or support for existing referrals.'),
  agentDetails: z.object({
    agentUsername: z.string().describe("The agent's username."),
    referralLink: z.string().describe("The agent's unique referral link."),
    traderUsername: z.string().optional().describe("The username of the trader/node the agent is associated with."),
    commissionRate: z.number().optional().describe("The commission rate the agent offers (e.g., 0.5)."),
  }).describe('Detailed information about the agent.'),
  clientDetails: z.object({
    clientUsername: z.string().optional().describe("The username of the client/referral."),
  }).optional().describe('Information about the target client/referral.'),
  additionalContext: z.string().optional().describe('Any additional context or specific instructions for the AI.'),
});
export type AgentAICommunicationAssistantInput = z.infer<typeof AgentAICommunicationAssistantInputSchema>;

const AgentAICommunicationAssistantOutputSchema = z.object({
  generatedMessage: z.string().describe('The AI-generated communication message.'),
  messagePurpose: z.enum(['recruitment', 'onboarding', 'support']).describe('The purpose of the generated message.'),
});
export type AgentAICommunicationAssistantOutput = z.infer<typeof AgentAICommunicationAssistantOutputSchema>;

export async function agentAICommunicationAssistant(
  input: AgentAICommunicationAssistantInput
): Promise<AgentAICommunicationAssistantOutput> {
  // Mock implementation for static export compatibility
  let message = "";
  if (input.messageType === 'recruitment') {
    message = `Join ConnectCrypto through my link: ${input.agentDetails.referralLink}. Secure P2P trading with high liquidity!`;
  } else if (input.messageType === 'onboarding') {
    message = `Welcome ${input.clientDetails?.clientUsername || 'there'}! Get started with ConnectCrypto using my link: ${input.agentDetails.referralLink}`;
  } else {
    message = `Hello! How can I help you with your ConnectCrypto experience?`;
  }

  return {
    generatedMessage: message,
    messagePurpose: input.messageType
  };
}

