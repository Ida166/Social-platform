import { createClient } from 'https://esm.sh/@supabase/supabase-js'

const supabaseUrl = 'https://sjtapuesjqubmdawxwzm.supabase.co'
const supabaseKey = 'sb_publishable_EmUWBzm8cbeN6HJt6QXTDg_0jsUCkNB'

export const supabase = createClient(supabaseUrl, supabaseKey)
