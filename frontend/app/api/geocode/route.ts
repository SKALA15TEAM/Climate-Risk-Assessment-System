import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json(
        { error: "주소 파라미터가 필요합니다." },
        { status: 400 }
      );
    }

    const apiKey = process.env.NEXT_PUBLIC_VWORLD_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API 키가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const encodedAddress = encodeURIComponent(address);
    const url = `https://api.vworld.kr/req/address?service=address&request=getcoord&version=2.0&crs=epsg:4326&address=${encodedAddress}&refine=true&simple=false&format=json&type=road&key=${apiKey}`;

    console.log("🔍 서버에서 주소 검색:", address);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP 오류: ${response.status}`);
    }

    const data = await response.json();
    console.log("📦 Vworld API 응답:", data);

    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ Geocoding 오류:", error);
    return NextResponse.json(
      {
        error: "주소 검색 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
