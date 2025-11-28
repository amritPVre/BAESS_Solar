import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  ChatMessage, 
  ChatSession, 
  CalculationInput, 
  CalculationResult,
  CalculationType 
} from '@/types/solar-ai-chat';
import { 
  CALCULATION_SYSTEM_PROMPTS, 
  getCalculationTask 
} from '@/config/solar-calculation-prompts';
import { supabase } from '@/integrations/supabase/client';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

class SolarAIChatService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  }

  /**
   * Send a message to Gemini AI with context
   */
  async sendMessage(
    userMessage: string,
    calculationType: CalculationType,
    context?: ChatMessage[]
  ): Promise<string> {
    try {
      const systemPrompt = CALCULATION_SYSTEM_PROMPTS[calculationType];
      const task = getCalculationTask(calculationType);

      // Build conversation history for context
      const conversationHistory = context?.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      })) || [];

      // Create chat session with history
      const chat = this.model.startChat({
        history: conversationHistory,
        generationConfig: {
          maxOutputTokens: 4096,
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
        },
      });

      // Construct the full prompt with system instructions
      const fullPrompt = `${systemPrompt}

Task: ${task?.name}
Description: ${task?.description}

User Request:
${userMessage}

Please provide a detailed, step-by-step response with:
1. Clear calculations with formulas shown
2. Specific numerical results
3. Professional insights and recommendations
4. Any relevant tables or data structures formatted clearly
5. Actionable next steps

Format your response in a clear, professional manner suitable for engineering documentation.`;

      const result = await chat.sendMessage(fullPrompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error sending message to Gemini:', error);
      throw new Error('Failed to get response from AI. Please try again.');
    }
  }

  /**
   * Perform a specific calculation with structured data
   */
  async performCalculation(
    calculationType: CalculationType,
    inputs: CalculationInput
  ): Promise<CalculationResult> {
    try {
      const task = getCalculationTask(calculationType);
      if (!task) {
        return {
          success: false,
          error: 'Invalid calculation type',
        };
      }

      // Validate required inputs
      const missingInputs = task.requiredInputs.filter(
        input => !(input in inputs)
      );
      if (missingInputs.length > 0) {
        return {
          success: false,
          error: `Missing required inputs: ${missingInputs.join(', ')}`,
        };
      }

      // Format inputs for prompt
      const inputDescription = Object.entries(inputs)
        .map(([key, value]) => `- ${key}: ${value}`)
        .join('\n');

      const prompt = `${CALCULATION_SYSTEM_PROMPTS[calculationType]}

Input Parameters:
${inputDescription}

Please perform the ${task.name} calculation with these inputs and provide:
1. Step-by-step calculations
2. Numerical results with units
3. Summary table of key outputs
4. Professional recommendations
5. Any warnings or considerations

Format the response clearly with sections for easy parsing.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        data: text,
        insights: this.extractInsights(text),
        recommendations: this.extractRecommendations(text),
      };
    } catch (error) {
      console.error('Error performing calculation:', error);
      return {
        success: false,
        error: 'Failed to perform calculation. Please try again.',
      };
    }
  }

  /**
   * Extract insights from AI response
   */
  private extractInsights(text: string): string[] {
    const insights: string[] = [];
    const insightsMatch = text.match(/insights?:?\s*([\s\S]*?)(?=recommendations?:|$)/i);
    
    if (insightsMatch && insightsMatch[1]) {
      const insightText = insightsMatch[1];
      const bulletPoints = insightText.match(/[•\-\*]\s*(.+)/g);
      if (bulletPoints) {
        insights.push(...bulletPoints.map(point => point.replace(/[•\-\*]\s*/, '').trim()));
      }
    }
    
    return insights;
  }

  /**
   * Extract recommendations from AI response
   */
  private extractRecommendations(text: string): string[] {
    const recommendations: string[] = [];
    const recoMatch = text.match(/recommendations?:?\s*([\s\S]*?)$/i);
    
    if (recoMatch && recoMatch[1]) {
      const recoText = recoMatch[1];
      const bulletPoints = recoText.match(/[•\-\*]\s*(.+)/g);
      if (bulletPoints) {
        recommendations.push(...bulletPoints.map(point => point.replace(/[•\-\*]\s*/, '').trim()));
      }
    }
    
    return recommendations;
  }

  /**
   * Save chat session to database
   */
  async saveChatSession(session: ChatSession): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('solar_ai_chat_sessions')
        .upsert({
          id: session.id,
          user_id: session.userId,
          title: session.title,
          messages: session.messages,
          calculation_type: session.calculationType,
          project_name: session.projectName,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        });

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      console.log('Chat session saved successfully:', data);
      return true;
    } catch (error) {
      console.error('Error saving chat session:', error);
      return false;
    }
  }

  /**
   * Load chat sessions for user
   */
  async loadChatSessions(userId: string): Promise<ChatSession[]> {
    try {
      const { data, error } = await supabase
        .from('solar_ai_chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return data?.map(session => ({
        id: session.id,
        userId: session.user_id,
        title: session.title,
        messages: (session.messages || []).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
        createdAt: new Date(session.created_at),
        updatedAt: new Date(session.updated_at),
        calculationType: session.calculation_type,
        projectName: session.project_name,
      })) || [];
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      return [];
    }
  }

  /**
   * Delete chat session
   */
  async deleteChatSession(sessionId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('solar_ai_chat_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting chat session:', error);
      return false;
    }
  }

  /**
   * Update chat session title
   */
  async updateSessionTitle(sessionId: string, newTitle: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('solar_ai_chat_sessions')
        .update({ title: newTitle, updated_at: new Date().toISOString() })
        .eq('id', sessionId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating chat title:', error);
      return false;
    }
  }

  /**
   * Generate title for chat session based on first message
   */
  async generateSessionTitle(firstMessage: string, calculationType: CalculationType): Promise<string> {
    try {
      const task = getCalculationTask(calculationType);
      const prompt = `Generate a short, descriptive title (max 50 characters) for a chat session about solar engineering calculations. The first message was: "${firstMessage.substring(0, 100)}..." and the task type is ${task?.name}. Return ONLY the title, nothing else.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const title = response.text().trim().replace(/['"]/g, '');
      
      return title.length > 50 ? title.substring(0, 50) + '...' : title;
    } catch (error) {
      console.error('Error generating title:', error);
      return `${getCalculationTask(calculationType)?.name || 'Solar Calculation'} - ${new Date().toLocaleDateString()}`;
    }
  }
}

export const solarAIChatService = new SolarAIChatService();
export default solarAIChatService;

