import { GoogleGenerativeAI } from '@google/generative-ai';

class GoogleAIService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error('Google AI API key not found. Please add VITE_GOOGLE_AI_API_KEY to your .env file');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  }

  async extractMedicineInfo(imageFile: File): Promise<any> {
    try {
      // Convert image to base64
      const imageData = await this.fileToGenerativePart(imageFile);
      
      const prompt = `
        Analyze this medicine package/label image and extract the following information in JSON format:
        
        {
          "name": "Full medicine name with dosage",
          "genericName": "Generic/salt name",
          "brandName": "Brand name",
          "dosage": "Dosage strength",
          "medicineType": "Type (Tablet/Capsule/Syrup/etc)",
          "manufacturer": "Manufacturer name",
          "scheduleType": "GENERAL/H/H1/X",
          "hsn": "HSN code",
          "batchNumber": "Batch number",
          "mrp": "Maximum Retail Price (number only)",
          "expiryDate": "Expiry date in YYYY-MM-DD format",
          "confidence": "Confidence score (0-100)"
        }
        
        Only return valid JSON. If any field is not clearly visible, use null for that field.
        For scheduleType, use "GENERAL" if not specified.
        For confidence, provide a score based on how clearly the information is visible.
      `;

      const result = await this.model.generateContent([prompt, imageData]);
      const response = await result.response;
      const text = response.text();
      
      // Parse JSON response
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        throw new Error('No valid JSON found in response');
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        throw new Error('Failed to parse AI response');
      }
    } catch (error) {
      console.error('Error extracting medicine info:', error);
      throw error;
    }
  }

  async processExtractedText(extractedText: string): Promise<any> {
    try {
      const prompt = `
        Parse this extracted text from a medicine package and convert it to structured JSON:
        
        "${extractedText}"
        
        Return JSON in this exact format:
        {
          "name": "Full medicine name with dosage",
          "genericName": "Generic/salt name",
          "brandName": "Brand name",
          "dosage": "Dosage strength",
          "medicineType": "Type (Tablet/Capsule/Syrup/etc)",
          "manufacturer": "Manufacturer name",
          "scheduleType": "GENERAL/H/H1/X",
          "hsn": "HSN code",
          "batchNumber": "Batch number",
          "mrp": "Maximum Retail Price (number only)",
          "expiryDate": "Expiry date in YYYY-MM-DD format",
          "confidence": "Confidence score (0-100)"
        }
        
        Only return valid JSON. If any field is not found, use null.
        For scheduleType, use "GENERAL" if not specified.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse JSON response
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        throw new Error('No valid JSON found in response');
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        throw new Error('Failed to parse AI response');
      }
    } catch (error) {
      console.error('Error processing text:', error);
      throw error;
    }
  }

  private async fileToGenerativePart(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = (reader.result as string).split(',')[1];
        resolve({
          inlineData: {
            data: base64Data,
            mimeType: file.type
          }
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

export const googleAIService = new GoogleAIService();