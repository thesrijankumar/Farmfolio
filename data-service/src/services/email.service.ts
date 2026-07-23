import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY ?? "");
const FROM = "Farmfolio <info@farmfolio.website>";

// ── Password reset ──────────────────────────────────────────────────────────
export async function sendResetEmail(to: string, resetUrl: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Reset your Farmfolio password",
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#FAFAF7;font-family:'IBM Plex Sans',Arial,sans-serif;color:#1a1a1a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAF7;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #d1e8d8;padding:48px 40px;max-width:560px;width:100%;">
        <tr><td>
          <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#2D6A4F;">Farmfolio</p>
          <h1 style="margin:8px 0 24px;font-size:28px;font-weight:500;color:#1B4332;letter-spacing:-0.02em;">Reset your password</h1>
          <p style="margin:0 0 32px;font-size:15px;line-height:1.6;color:#444;">
            We received a request to reset the password for your Farmfolio account.
            This link expires in <strong>1 hour</strong>.
          </p>
          <a href="${resetUrl}" style="display:inline-block;background:#2D6A4F;color:#FAFAF7;text-decoration:none;font-size:14px;font-weight:500;letter-spacing:0.04em;padding:14px 28px;">
            Set new password &rarr;
          </a>
          <p style="margin:32px 0 0;font-size:12px;color:#888;line-height:1.5;">
            If you did not request this, you can safely ignore this email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

// ── Report delivery ─────────────────────────────────────────────────────────
interface ReportData {
  location: { lat: number; lon: number };
  climate: {
    avgTemperatureC: number;
    avgRainfallMM: number;
    avgHumidityPct: number;
    avgSolarRadiation: number;
    avgWindSpeed: number;
  };
  vegetation: {
    ndviMean: number;
    interpretation: string;
    ndreMean?: number | null;
    ndreInterpretation?: string;
  };
  summary?: string | null;
}

function bar(pct: number): string {
  const w = Math.round(Math.max(0, Math.min(1, pct)) * 100);
  return `<div style="background:#e8f0eb;border-radius:2px;height:6px;width:100%;margin-top:6px;"><div style="background:#2D6A4F;border-radius:2px;height:6px;width:${w}%;"></div></div>`;
}

export async function sendReportEmail(to: string, data: ReportData, sessionId?: string | null) {
  const { location, climate, vegetation, summary } = data;
  const lat = location.lat.toFixed(4);
  const lon = location.lon.toFixed(4);
  const sess = sessionId ? sessionId.slice(0, 8) : "—";

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your Farmfolio field report · ${lat}°, ${lon}°`,
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#FAFAF7;font-family:'IBM Plex Sans',Arial,sans-serif;color:#1a1a1a;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAF7;padding:40px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #d1e8d8;max-width:600px;width:100%;">
      <tr><td style="background:#1B4332;padding:28px 40px;">
        <p style="margin:0;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#a8d5b8;">Farmfolio &middot; Field Report</p>
        <h1 style="margin:8px 0 0;font-size:26px;font-weight:500;color:#FAFAF7;letter-spacing:-0.02em;">${lat}&deg;, ${lon}&deg;</h1>
        <p style="margin:4px 0 0;font-size:12px;color:#6ab88a;letter-spacing:0.05em;">Session ${sess}</p>
      </td></tr>
      ${summary ? `<tr><td style="padding:32px 40px 0;">
        <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#2D6A4F;">AI Field Note</p>
        <p style="margin:0;font-size:15px;line-height:1.7;color:#333;font-style:italic;">${summary}</p>
      </td></tr>` : ""}
      <tr><td style="padding:32px 40px 0;">
        <p style="margin:0 0 20px;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#2D6A4F;border-top:1px solid #d1e8d8;padding-top:24px;">Climate &middot; NASA POWER</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="20%" style="padding:0 8px 16px 0;vertical-align:top;">
              <p style="margin:0;font-size:10px;text-transform:uppercase;letter-spacing:0.12em;color:#888;">Temp</p>
              <p style="margin:4px 0 0;font-size:26px;font-weight:400;color:#1B4332;letter-spacing:-0.03em;">${climate.avgTemperatureC.toFixed(1)}</p>
              <p style="margin:0;font-size:11px;color:#aaa;">&deg;C</p>
            </td>
            <td width="20%" style="padding:0 8px 16px;vertical-align:top;">
              <p style="margin:0;font-size:10px;text-transform:uppercase;letter-spacing:0.12em;color:#888;">Rain</p>
              <p style="margin:4px 0 0;font-size:26px;font-weight:400;color:#1B4332;letter-spacing:-0.03em;">${climate.avgRainfallMM.toFixed(0)}</p>
              <p style="margin:0;font-size:11px;color:#aaa;">mm</p>
            </td>
            <td width="20%" style="padding:0 8px 16px;vertical-align:top;">
              <p style="margin:0;font-size:10px;text-transform:uppercase;letter-spacing:0.12em;color:#888;">Humidity</p>
              <p style="margin:4px 0 0;font-size:26px;font-weight:400;color:#1B4332;letter-spacing:-0.03em;">${climate.avgHumidityPct.toFixed(0)}</p>
              <p style="margin:0;font-size:11px;color:#aaa;">%</p>
            </td>
            <td width="20%" style="padding:0 8px 16px;vertical-align:top;">
              <p style="margin:0;font-size:10px;text-transform:uppercase;letter-spacing:0.12em;color:#888;">Solar</p>
              <p style="margin:4px 0 0;font-size:26px;font-weight:400;color:#1B4332;letter-spacing:-0.03em;">${climate.avgSolarRadiation.toFixed(1)}</p>
              <p style="margin:0;font-size:11px;color:#aaa;">MJ/m&sup2;</p>
            </td>
            <td width="20%" style="padding:0 0 16px 8px;vertical-align:top;">
              <p style="margin:0;font-size:10px;text-transform:uppercase;letter-spacing:0.12em;color:#888;">Wind</p>
              <p style="margin:4px 0 0;font-size:26px;font-weight:400;color:#1B4332;letter-spacing:-0.03em;">${climate.avgWindSpeed.toFixed(1)}</p>
              <p style="margin:0;font-size:11px;color:#aaa;">m/s</p>
            </td>
          </tr>
        </table>
      </td></tr>
      <tr><td style="padding:8px 40px 40px;">
        <p style="margin:0 0 16px;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#2D6A4F;border-top:1px solid #d1e8d8;padding-top:24px;">Vegetation &middot; NDVI &middot; Sentinel-2</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="50%" style="padding-right:20px;vertical-align:top;">
              <p style="margin:0;font-size:10px;text-transform:uppercase;letter-spacing:0.12em;color:#888;">NDVI (mean)</p>
              <p style="margin:4px 0 0;font-size:34px;font-weight:400;color:#1B4332;letter-spacing:-0.03em;">${vegetation.ndviMean.toFixed(3)}</p>
              ${bar(vegetation.ndviMean)}
              <p style="margin:8px 0 0;font-size:12px;color:#555;">${vegetation.interpretation}</p>
            </td>
            ${vegetation.ndreMean != null ? `<td width="50%" style="padding-left:20px;vertical-align:top;">
              <p style="margin:0;font-size:10px;text-transform:uppercase;letter-spacing:0.12em;color:#888;">NDRE &mdash; Nitrogen proxy</p>
              <p style="margin:4px 0 0;font-size:34px;font-weight:400;color:#1B4332;letter-spacing:-0.03em;">${vegetation.ndreMean.toFixed(3)}</p>
              ${bar((vegetation.ndreMean ?? 0) / 0.45)}
              <p style="margin:8px 0 0;font-size:12px;color:#555;">${vegetation.ndreInterpretation ?? ""}</p>
            </td>` : ""}
          </tr>
        </table>
      </td></tr>
      <tr><td style="background:#f4f8f5;border-top:1px solid #d1e8d8;padding:20px 40px;">
        <p style="margin:0;font-size:12px;color:#888;line-height:1.5;">
          Generated by <strong style="color:#2D6A4F;">Farmfolio</strong> &middot; Field intelligence from open satellite data.
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`,
  });
}
