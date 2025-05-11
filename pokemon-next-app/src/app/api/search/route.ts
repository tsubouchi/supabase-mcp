import { NextResponse, NextRequest } from 'next/server'
import { supabase } from '@/lib/supabaseClient' // エイリアスパスを確認

// 許可するオリジン (本番環境では具体的なドメインに変更してください)
const ALLOWED_ORIGIN = process.env.NODE_ENV === 'production' ? 'https://your-production-domain.com' : '*';

// CORSヘッダーを付与する共通関数
function applyCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  response.headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

// OPTIONSリクエストのハンドラ (プリフライトリクエスト対応)
export async function OPTIONS(request: NextRequest) {
  let response = NextResponse.json({}, { status: 200 });
  return applyCorsHeaders(response);
}

export async function POST(request: NextRequest) {
  let apiResponse;
  try {
    const body = await request.json()
    const query = body.query?.trim()

    if (!query) {
      apiResponse = NextResponse.json({ error: 'Search query is required' }, { status: 400 })
      return applyCorsHeaders(apiResponse)
    }

    // Supabase で ILIKE を使う場合、% はクライアント側で付与する
    const nameLikeQuery = `%${query}%`

    const { data, error } = await supabase
      .from('pokemons')
      .select('*')
      .or(`name_ja.ilike.${nameLikeQuery},type_1.eq.${query},type_2.eq.${query}`)
      .order('national_no', { ascending: true })

    if (error) {
      console.error('Supabase query error:', error)
      apiResponse = NextResponse.json({ error: 'Database query failed', details: error.message }, { status: 500 })
      return applyCorsHeaders(apiResponse)
    }

    apiResponse = NextResponse.json({ data })
    return applyCorsHeaders(apiResponse)

  } catch (e) {
    console.error('API error:', e)
    if (e instanceof SyntaxError) {
        apiResponse = NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    } else {
        apiResponse = NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
    return applyCorsHeaders(apiResponse)
  }
} 