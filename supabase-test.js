import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://mdlbajgnntjwhycouzit.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kbGJhamdubnRqd2h5Y291eml0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjYxMzQ1OCwiZXhwIjoyMDgyMTg5NDU4fQ.enSIruahzvMZo1IEzGEeom3GHAcEqnVW6cfoagkZUp0'

async function test() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  const { data, error } = await supabase
    .from('monthly_closures')
    .select('id')
    .limit(1)

  console.log('DATA:', data)
  console.log('ERROR:', error)
}

test()
