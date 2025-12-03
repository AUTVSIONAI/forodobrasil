// IMPORTANT: This script uses the Supabase service role to create a test user
// It reads environment variables from .env.local

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
// load env from .env.local without dotenv
try{
  const envPath = path.resolve(process.cwd(), '.env.local')
  if(fs.existsSync(envPath)){
    const txt = fs.readFileSync(envPath, 'utf8')
    txt.split(/\r?\n/).forEach(line=>{
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
      if(m){
        const k = m[1];
        let v = m[2]
        if(v.startsWith('"') && v.endsWith('"')) v = v.slice(1,-1)
        if(!(k in process.env)) process.env[k]=v
      }
    })
  }
}catch{}

async function main(){
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE
  if(!url || !key){
    console.error('Missing Supabase URL or Service Role Key in environment')
    process.exit(1)
  }
  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
  const email = 'teste@forodobrasil.com'
  const password = '12345678@'
  const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true })
  if(error){
    console.error('Create user error:', error.message)
    process.exit(1)
  }
  const uid = data.user?.id
  console.log('User created:', uid)
  if(uid){
    const { error: upErr } = await supabase.from('user_profiles').upsert({ user_id: uid, full_name: 'Teste', role: 'membro' }, { onConflict: 'user_id' })
    if(upErr){
      console.error('Profile upsert error:', upErr.message)
      process.exit(1)
    }
  }
  console.log('Done')
}

main().catch((e)=>{ console.error('Unexpected error:', e?.message||e); process.exit(1) })
