import { supabase } from '../../Supabase.js'

/*Load in the clubs */
export async function getClubs() {
    const { data, error } = await supabase
        .from('clubs')
        .select('*')

    if (error) {
        console.error(error)
        return []
    }

    return data
}

/*Load in the events */
export async function getEvent() {
    const { data, error } = await supabase
        .from('events')
        .select('*')

    if (error) {
        console.error(error)
        return []
    }

    return data
}