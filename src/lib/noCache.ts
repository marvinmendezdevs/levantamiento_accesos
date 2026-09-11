import { NextResponse } from "next/server";

/**
 * JSON de respuesta sin caché en absoluto — ni el navegador, ni proxies/CDN
 * intermedios, ni el Data Cache de Next. Complementa `dynamic = "force-dynamic"`
 * y `revalidate = 0` (que controlan el re-render/refetch del lado del servidor,
 * pero no necesariamente los headers HTTP que ve el navegador).
 */
export function noCacheJson<T>(data: T, init?: number | ResponseInit) {
  const responseInit: ResponseInit = typeof init === "number" ? { status: init } : (init ?? {});
  return NextResponse.json(data, {
    ...responseInit,
    headers: {
      ...responseInit.headers,
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}
