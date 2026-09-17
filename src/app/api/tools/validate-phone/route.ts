import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import parsePhoneNumber, { isValidPhoneNumber, CountryCode } from "libphonenumber-js";

const PhoneSchema = z.object({
  phoneNumber: z.string().min(4, "Nomor telepon terlalu pendek."),
  defaultCountry: z.string().length(2).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = PhoneSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { phoneNumber, defaultCountry } = parsed.data;
    const country = (defaultCountry?.toUpperCase() || "ID") as CountryCode;

    const isValid = isValidPhoneNumber(phoneNumber, country);
    const parsedNum = parsePhoneNumber(phoneNumber, country);

    if (!parsedNum) {
      return NextResponse.json(
        { success: false, error: "Nomor telepon tidak dapat diparsing." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      provider: "Google libphonenumber Engine",
      input: phoneNumber,
      isValid,
      country: parsedNum.country || "-",
      countryCallingCode: `+${parsedNum.countryCallingCode}`,
      formatInternational: parsedNum.formatInternational(),
      formatNational: parsedNum.formatNational(),
      formatE164: parsedNum.format("E.164"),
      formatRfc3966: parsedNum.getURI(),
      numberType: parsedNum.getType() || "UNKNOWN",
      isPossible: parsedNum.isPossible(),
      privacyNotice:
        "Validasi hanya memeriksa keabsahan format nomor telekomunikasi sesuai regulasi ITU-T, tanpa mengidentifikasi nama atau alamat pemilik nomor.",
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Gagal memproses nomor telepon: " + err.message },
      { status: 500 }
    );
  }
}
