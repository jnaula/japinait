import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log("Hello from delete-expired-events!")

Deno.serve(async (req) => {
  try {
    // Create a Supabase client with the Auth context of the logged in user.
    const supabaseClient = createClient(
      // Supabase API URL - env var exported by default.
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase API SERVICE ROLE KEY - env var exported by default.
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    )

    // Calculate the date 1 day ago
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    console.log(`Deleting events older than ${oneDayAgo}`)

    // Delete events where event_date is older than 1 day ago
    const { count, error } = await supabaseClient
      .from('events')
      .delete({ count: 'exact' })
      .lt('event_date', oneDayAgo)

    if (error) {
      console.error('Error deleting events:', error)
      throw error
    }

    console.log(`Deleted ${count} expired events`)

    return new Response(
      JSON.stringify({ message: `Deleted ${count} expired events`, count }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
