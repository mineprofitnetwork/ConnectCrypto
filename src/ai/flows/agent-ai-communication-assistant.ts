'use server';
/**
 * @fileOverview An AI assistant for agents to generate recruitment and communication messages.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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

const recruitmentPrompt = ai.definePrompt({
  name: 'agentRecruitmentPrompt',
  input: {schema: AgentAICommunicationAssistantInputSchema},
  output: {schema: AgentAICommunicationAssistantOutputSchema},
  prompt: `You are an AI assistant for a P2P crypto trading agent. Your goal is to generate a professional recruitment message to attract new users to the platform through the agent's referral link.

Agent: {{{agentDetails.agentUsername}}}
Referral Link: {{{agentDetails.referralLink}}}
{{#if agentDetails.traderUsername}}
Associated Node: {{{agentDetails.traderUsername}}}
{{/if}}
{{#if agentDetails.commissionRate}}
Commission Rate: {{{agentDetails.commissionRate}}}%
{{/if}}
Additional Context: {{{additionalContext}}}

Generate a persuasive and professional message that highlights the benefits of joining the ConnectCrypto platform through {{{agentDetails.agentUsername}}}'s link. Mention secure P2P trading, institutional liquidity, and any other relevant benefits.

Provide the response in the following JSON format:

json
{
  "generatedMessage": "string",
  "messagePurpose": "recruitment"
}
`
});

const onboardingPrompt = ai.definePrompt({
  name: 'agentOnboardingPrompt',
  input: {schema: AgentAICommunicationAssistantInputSchema},
  output: {schema: AgentAICommunicationAssistantOutputSchema},
  prompt: `You are an AI assistant for a P2P crypto trading agent. Your goal is to generate a welcoming onboarding message for a new referral.

Agent: {{{agentDetails.agentUsername}}}
Referral: {{{clientDetails.clientUsername}}}
Referral Link: {{{agentDetails.referralLink}}}
Additional Context: {{{additionalContext}}}

Generate a warm and helpful welcome message for {{{clientDetails.clientUsername}}}. Explain the next steps for them to start trading, such as completing KYC or browsing the marketplace.

Provide the response in the following JSON format:

json
{
  "generatedMessage": "string",
  "messagePurpose": "onboarding"
}
`
});

const supportPrompt = ai.definePrompt({
  name: 'agentSupportPrompt',
  input: {schema: AgentAICommunicationAssistantInputSchema},
  output: {schema: AgentAICommunicationAssistantOutputSchema},
  prompt: `You are an AI assistant for a P2P crypto trading agent. Your goal is to generate a supportive message for an existing referral.

Agent: {{{agentDetails.agentUsername}}}
Referral: {{{clientDetails.clientUsername}}}
Additional Context: {{{additionalContext}}}

Generate a helpful and professional support message for {{{clientDetails.clientUsername}}}. Address any concerns or questions they might have based on the additional context provided.

Provide the response in the following JSON format:

json
{
  "generatedMessage": "string",
  "messagePurpose": "support"
}
`
});

export async function agentAICommunicationAssistant(
  input: AgentAICommunicationAssistantInput
): Promise<AgentAICommunicationAssistantOutput> {
  return agentAICommunicationAssistantFlow(input);
}

const agentAICommunicationAssistantFlow = ai.defineFlow(
  {
    name: 'agentAICommunicationAssistantFlow',
    inputSchema: AgentAICommunicationAssistantInputSchema,
    outputSchema: AgentAICommunicationAssistantOutputSchema,
  },
  async (input) => {
    let response;

    if (input.messageType === 'recruitment') {
      response = await recruitmentPrompt(input);
    } else if (input.messageType === 'onboarding') {
      response = await onboardingPrompt(input);
    } else if (input.messageType === 'support') {
      response = await supportPrompt(input);
    } else {
      throw new Error('Invalid messageType provided.');
    }

    if (!response.output) {
      throw new Error('AI did not return a message.');
    }

    return response.output;
  }
);
