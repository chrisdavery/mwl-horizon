const countrySelect = document.querySelector('select[name="contact[country]"]');
if (!countrySelect) {
  console.warn('[country-autoselect] <select name="contact[country]"> not found');
} else {
  (async () => {
    const selectBy = (target) => {
      if (!target) return false;
      const t = String(target).trim().toLowerCase();
      // Prefer matching by value
      for (const opt of countrySelect.options) {
        if (opt.value.trim().toLowerCase() === t) {
          countrySelect.value = opt.value;
          countrySelect.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
      }
      // Fallback: match by visible text
      for (const opt of countrySelect.options) {
        if (opt.text.trim().toLowerCase() === t) {
          countrySelect.value = opt.value;
          countrySelect.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
      }
      return false;
    };

    // Region buckets for your dropdown
    const MIDDLE_EAST = new Set(['AE','SA','QA','KW','BH','OM','JO','LB','SY','IQ','IR','IL','YE','TR','PS']);
    const EUROPE = new Set([
      'AL','AD','AT','BY','BE','BA','BG','HR','CY','CZ','DK','EE','FO','FI','FR','DE','GI','GR','GG','HU','IS',
      'IE','IM','IT','JE','LV','LI','LT','LU','MT','MD','MC','ME','MK','NL','NO','PL','PT','RO','RU','SM','RS',
      'SK','SI','ES','SE','CH','UA','GB','VA'
    ]);
    const ASIA = new Set([
      'PH','CN','HK','MO','TW','JP','KR','KP','VN','TH','MY','SG','ID','BN','KH','LA','MM','TL','IN','PK','BD',
      'LK','NP','BT','MV','KZ','KG','TJ','TM','UZ','AM','AZ','GE','MN'
    ]);
    const AFRICA = new Set([
      'DZ','AO','BJ','BW','BF','BI','CM','CV','CF','TD','KM','CG','CD','CI','DJ','EG','GQ','ER','ET','GA','GM',
      'GH','GN','GW','KE','LS','LR','LY','MG','MW','ML','MR','MU','MA','MZ','NA','NE','NG','RE','RW','ST','SN',
      'SC','SL','SO','SS','SD','SZ','TZ','TG','TN','UG','ZM','ZW' // ZA handled specifically
    ]);
    // Americas except US/CA go to "South America" bucket in your UI
    const AMERICAS_EX_US_CA = new Set([
      'MX','AR','BO','BR','CL','CO','EC','FK','GF','GY','PE','PY','SR','UY','VE',
      'AG','AI','AW','BB','BL','BM','BQ','BS','BZ','CR','CU','CW','DM','DO','GD','GL','GP','GT','HN','HT','JM',
      'KN','KY','LC','MF','MQ','MS','NI','PA','PM','PR','SV','SX','TC','TT','VC','VG','VI'
    ]);

    try {
      const url =
        `${window.Shopify.routes.root}browsing_context_suggestions.json` +
        `?country[enabled]=true&country[exclude]=${window.Shopify.country}` +
        `&language[enabled]=true&language[exclude]=${window.Shopify.language}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const c = data?.detected_values?.country;
      if (!c) return;

      const code = (c.handle || '').toUpperCase();       // e.g. "US"
      const name = (c.name || '').trim();                // e.g. "United States"

      // 1) Direct country->your label
      const direct = {
        AU: 'Australia',
        NZ: 'New Zealand',
        GB: 'UK',
        US: 'USA',
        CA: 'Canada',
        ZA: 'South Africa',
        CH: 'Switzerland',
        NO: 'Norway',
        // Name-based fallbacks
        'United Kingdom': 'UK',
        'United States': 'USA',
        Australia: 'Australia',
        'New Zealand': 'New Zealand',
        Canada: 'Canada',
        'South Africa': 'South Africa',
        Switzerland: 'Switzerland',
        Norway: 'Norway'
      };

      let target =
        direct[code] ||
        direct[name] ||
        (MIDDLE_EAST.has(code) && 'Middle East') ||
        (EUROPE.has(code) && 'Europe') ||
        (ASIA.has(code) && 'Asia') ||
        (AFRICA.has(code) && 'Africa') ||
        (AMERICAS_EX_US_CA.has(code) && 'South America') ||
        null;

      if (!target) {
        // Nothing matched; bail quietly
        return;
      }

        // Apply selection
        let matched = selectBy(target) || selectBy(name);

        if (matched) {
            countrySelect.classList.add('disabled');
            countrySelect.closest('.select-option')?.classList.remove('hidden')
        }
    } catch (err) {
      console.warn('[country-autoselect] Failed:', err);
    }
  })();
}
