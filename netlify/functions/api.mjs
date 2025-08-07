// Netlify Edge Function for handling all API routes
export default async (request, context) => {
  const url = new URL(request.url);
  
  // Route all /api/* requests to the Astro SSR handler
  if (url.pathname.startsWith('/api/')) {
    // Import the Astro SSR handler
    const { handler } = await import('../../.netlify/build/entry.mjs');
    return handler(request, context);
  }
  
  // Return 404 for non-API routes
  return new Response('Not Found', { status: 404 });
};

export const config = {
  path: "/api/*"
};