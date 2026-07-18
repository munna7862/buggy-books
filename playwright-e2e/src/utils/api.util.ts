import axios from "axios";
import { CommonFunctions } from "./common.util";

export class ApiUtil {
  private objCommonFunctions: CommonFunctions;

  constructor() {
    this.objCommonFunctions = new CommonFunctions();
  }

  /**
   * Enhanced method to make HTTP requests with better error handling and logging
   * Combines functionality from processAPIRequest with full method support
   */
  public async makeRequest(options: {
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    url: string;
    data?: any;
    headers?: Record<string, string>;
    logMessage: string;
    responseType?: "data" | "status" | "headers" | "full";
    timeout?: number;
  }): Promise<any> {
    const { method, url, data, headers = {}, logMessage, responseType = "data", timeout = 30000 } = options;

    try {
      await this.objCommonFunctions.logMessage("INFO", `🚀 Making ${method} request to ${url}`);
      if (data) {
        await this.objCommonFunctions.logMessage("INFO", `📤 Request Payload: ${JSON.stringify(data, null, 2)}`);
      }

      const config: any = {
        method,
        url,
        headers: { "Content-Type": "application/json", ...headers },
        timeout,
        ...(data && ["POST", "PUT", "PATCH"].includes(method) && { data }),
      };

      const response = await axios(config);

      await this.objCommonFunctions.logMessage("PASS", `✅ ${logMessage} Success! Status: ${response.status} ${response.statusText}`);
      if (response.headers['trace-id']) {
        await this.objCommonFunctions.logMessage("INFO", `🔍 Trace ID: ${response.headers['trace-id']}`);
      }
      await this.objCommonFunctions.logMessage("INFO", `📥 Response Payload: ${JSON.stringify(response.data, null, 2)}`);

      return responseType === "full" ? response : response[responseType];
    } catch (error: any) {
      const errorDetails = error.response
        ? `Status: ${error.response.status} ${error.response.statusText} | Response: ${JSON.stringify(error.response.data, null, 2)}`
        : `Message: ${error.message}`;

      await this.objCommonFunctions.logMessage("FAIL", `❌ ${logMessage} Failed! ${errorDetails}`);

      // Return structured error response for better handling
      return {
        success: false,
        status: error.response?.status ?? null,
        data: error.response?.data ?? null,
        headers: error.response?.headers ?? {},
        message: error.message
      };
    }
  }

  public async getBearerToken(authUrl: string = process.env.AUTH_URL as string, clientId: string = process.env.CLIENT_ID as string, clientSecret: string = process.env.CLIENT_SECRET as string, scope: string = process.env.SCOPE as string, realmId: string = process.env.REALM_ID as string): Promise<string> {
    const url = "" + authUrl + "?realmId=" + realmId + "";
    const requestData = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: scope,
      grant_type: "client_credentials"
    });
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
    };

    await this.objCommonFunctions.logMessage("INFO", `Fetching Bearer Token from ${url} with data: ${requestData.toString()}`);
    const response = await this.makeRequest({
      method: "POST",
      url,
      data: requestData,
      headers,
      logMessage: "Fetching Bearer Token"
    });
    return response.access_token;
  }

}

export default new ApiUtil();