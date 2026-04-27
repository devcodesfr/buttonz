import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
): Promise<Response> {
  const shouldLog = url.startsWith("/api/auth") || url === "/api/user/current";
  // #region agent log
  if (shouldLog) fetch('http://127.0.0.1:7855/ingest/e6e06c55-184c-447a-b3f0-43f18b3c62bc',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'59f846'},body:JSON.stringify({sessionId:'59f846',runId:'pre-fix-buttonz-auth',hypothesisId:'A,B,C',location:'buttonz/client/src/lib/queryClient.ts:18',message:'Buttonz apiRequest start',data:{method,url,hasBody:Boolean(data),origin:window.location.origin,href:window.location.href},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });
  } catch (error) {
    // #region agent log
    if (shouldLog) fetch('http://127.0.0.1:7855/ingest/e6e06c55-184c-447a-b3f0-43f18b3c62bc',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'59f846'},body:JSON.stringify({sessionId:'59f846',runId:'pre-fix-buttonz-auth',hypothesisId:'A,B,C',location:'buttonz/client/src/lib/queryClient.ts:32',message:'Buttonz apiRequest network error',data:{method,url,errorMessage:error instanceof Error ? error.message : String(error)},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    throw error;
  }

  // #region agent log
  if (shouldLog) fetch('http://127.0.0.1:7855/ingest/e6e06c55-184c-447a-b3f0-43f18b3c62bc',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'59f846'},body:JSON.stringify({sessionId:'59f846',runId:'pre-fix-buttonz-auth',hypothesisId:'A,B,C',location:'buttonz/client/src/lib/queryClient.ts:39',message:'Buttonz apiRequest response',data:{method,url,status:res.status,ok:res.ok,responseUrl:res.url},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T | null> =
  ({ on401 }) =>
  async ({ queryKey }) => {
    const url = queryKey.join("/") as string;
    const shouldLog = url === "/api/user/current";
    // #region agent log
    if (shouldLog) fetch('http://127.0.0.1:7855/ingest/e6e06c55-184c-447a-b3f0-43f18b3c62bc',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'59f846'},body:JSON.stringify({sessionId:'59f846',runId:'pre-fix-buttonz-auth',hypothesisId:'A,B,C',location:'buttonz/client/src/lib/queryClient.ts:55',message:'Buttonz query start',data:{url,origin:window.location.origin,href:window.location.href},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    let res: Response;
    try {
      res = await fetch(url, {
        credentials: "include",
      });
    } catch (error) {
      // #region agent log
      if (shouldLog) fetch('http://127.0.0.1:7855/ingest/e6e06c55-184c-447a-b3f0-43f18b3c62bc',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'59f846'},body:JSON.stringify({sessionId:'59f846',runId:'pre-fix-buttonz-auth',hypothesisId:'A,B,C',location:'buttonz/client/src/lib/queryClient.ts:68',message:'Buttonz query network error',data:{url,errorMessage:error instanceof Error ? error.message : String(error)},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      throw error;
    }

    // #region agent log
    if (shouldLog) fetch('http://127.0.0.1:7855/ingest/e6e06c55-184c-447a-b3f0-43f18b3c62bc',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'59f846'},body:JSON.stringify({sessionId:'59f846',runId:'pre-fix-buttonz-auth',hypothesisId:'A,B,C',location:'buttonz/client/src/lib/queryClient.ts:76',message:'Buttonz query response',data:{url,status:res.status,ok:res.ok,responseUrl:res.url},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    if (on401 === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchOnWindowFocus: false,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
