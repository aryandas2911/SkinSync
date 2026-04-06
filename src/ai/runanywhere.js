// Mock implementation of the RunAnywhere SDK for local testing bypass
export const RunAnywhere = {
  loadModel: async (modelName) => {
    console.log(`[RunAnywhere SDK] Initializing local model: ${modelName} ...`);
    // Simulate loading time
    await new Promise(resolve => setTimeout(resolve, 800));

    return {
      generate: async ({ prompt, image, temperature, max_tokens }) => {
        // Handle Product Name Extraction (Front Label)
        if (prompt.includes('product identification expert')) {
          const ocrMatch = prompt.match(/OCR TEXT:\s*"([\s\S]*?)"\s*\n\s*Return/i);
          const ocrText = ocrMatch ? ocrMatch[1] : '';

          // Clean the OCR text aggressively before analysis
          const cleanOCR = ocrText
            .replace(/[{}|\\[\]<>~`@#$^&*_=]/g, ' ')  // Replace garbage with spaces
            .replace(/[^\x20-\x7E\n]/g, '')             // Remove non-printable chars
            .replace(/\s{2,}/g, ' ')                     // Collapse whitespace
            .trim();

          // Use intelligent keyword matching to find brand + product name
          const lines = cleanOCR.split(/[\n\r]+/).map(l => l.trim()).filter(l => l.length > 1);

          // Known brand patterns — generous matching to handle OCR noise
          const brandPatterns = [
            { regex: /p\s*o\s*n\s*d\s*'?\s*s/i, brand: "POND'S" },
            { regex: /cerave/i, brand: "CeraVe" },
            { regex: /neutrogena/i, brand: "Neutrogena" },
            { regex: /nivea/i, brand: "Nivea" },
            { regex: /lakm[eé]/i, brand: "Lakme" },
            { regex: /dove/i, brand: "Dove" },
            { regex: /olay/i, brand: "Olay" },
            { regex: /garnier/i, brand: "Garnier" },
            { regex: /l'?oreal|loreal/i, brand: "L'Oreal" },
            { regex: /biotique/i, brand: "Biotique" },
            { regex: /mamaearth/i, brand: "Mamaearth" },
            { regex: /himalaya/i, brand: "Himalaya" },
            { regex: /the\s*ordinary/i, brand: "The Ordinary" },
            { regex: /minimalist/i, brand: "Minimalist" },
            { regex: /plum/i, brand: "Plum" },
            { regex: /simple/i, brand: "Simple" },
            { regex: /clean\s*&?\s*clear/i, brand: "Clean & Clear" },
            { regex: /vaseline/i, brand: "Vaseline" },
            { regex: /aveeno/i, brand: "Aveeno" },
            { regex: /st\.?\s*ives/i, brand: "St. Ives" },
            { regex: /clinique/i, brand: "Clinique" },
            { regex: /cetaphil/i, brand: "Cetaphil" },
            { regex: /johnsons|johnson'?s/i, brand: "Johnson's" },
            { regex: /pears/i, brand: "Pears" },
            { regex: /lux/i, brand: "Lux" },
            { regex: /fair.?lovely|glow.?lovely/i, brand: "Glow & Lovely" },
          ];

          let detectedBrand = '';
          for (const bp of brandPatterns) {
            if (bp.regex.test(cleanOCR)) {
              detectedBrand = bp.brand;
              break;
            }
          }

          // Product type keywords to look for — ordered by specificity
          const productKeywords = [
            /super\s*light\s*gel/i,
            /oil\s*free\s*moistur\w*/i,
            /hydrat\w*\s*(cleanser|cream|lotion|gel|moistur\w*)/i,
            /face\s*wash/i, /sun\s*screen/i, /sun\s*block/i,
            /body\s*lotion/i, /night\s*cream/i, /day\s*cream/i, /bb\s*cream/i,
            /eye\s*cream/i, /lip\s*balm/i,
            /moistur\w*/i, /cleanser/i, /serum/i,
            /toner/i, /cream/i, /lotion/i, /gel/i,
            /foundation/i, /primer/i, /mask/i, /scrub/i, /exfoliat\w*/i,
            /mist/i, /spray/i, /balm/i, /butter/i, /oil/i, /foam/i, /mousse/i,
            /shampoo/i, /conditioner/i,
          ];

          let detectedProduct = '';
          for (const pk of productKeywords) {
            const match = cleanOCR.match(pk);
            if (match) {
              detectedProduct = match[0].replace(/\s+/g, ' ').trim();
              // Title case it
              detectedProduct = detectedProduct.split(' ')
                .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                .join(' ');
              break;
            }
          }

          let finalName = '';
          if (detectedBrand && detectedProduct) {
            finalName = `${detectedBrand} ${detectedProduct}`;
          } else if (detectedBrand) {
            finalName = detectedBrand;
          } else if (detectedProduct) {
            finalName = detectedProduct;
          } else {
            // Last resort: grab the longest meaningful line
            const meaningfulLines = lines
              .filter(l => l.length > 3 && !/^(new|for |ingredients|mrp|net|mfg|lic|made|formulated|barcode|\d{4,})/i.test(l))
              .filter(l => /[a-zA-Z]{3,}/.test(l))
              .map(l => l.replace(/[{}|\\[\]<>]/g, '').trim())
              .filter(l => l.length > 2);
            finalName = meaningfulLines.length > 0 ? meaningfulLines[0].substring(0, 40) : 'Scanned Product';
          }

          console.log(`[AI Agent] Extracted product name: "${finalName}" from front label OCR`);
          return { text: finalName };
        }

        // Handle Verification Phase (Step 2)
        if (prompt.includes('INCI (International Nomenclature of Cosmetic Ingredients) expert')) {
          const inputMatch = prompt.match(/INPUT TEXT:\s*"([\s\S]*)"/i);
          const rawInput = inputMatch ? inputMatch[1] : "";

          // Mock Verification: Lowercase, Unique, and Filter fragments
          const verifiedSet = new Set(
            rawInput.split(/[,;\n•|]/)
              .map(s => s.trim().toLowerCase())
              .filter(s => s.length > 3 && /[a-z]/.test(s))
          );

          const verified = Array.from(verifiedSet).join(', ');
          console.log(`[AI Verifier] Finalized ${verifiedSet.size} unique, clean ingredients.`);
          return { text: verified };
        }

        // Handle Routine Analysis (Step 4)
        if (prompt.includes('analyze a Daily Skincare Routine')) {
          console.log('[AI Routine Engine] Evaluating full morning/night regime...');

          // --- BEGIN MOCK REASONING ENGINE ---
          const lowerPrompt = prompt.toLowerCase();
          const hasVitC = lowerPrompt.includes('vitamin c') || lowerPrompt.includes('ascorbic');
          const hasRetinol = lowerPrompt.includes('retinol') || lowerPrompt.includes('tretinoin');
          const hasSalicylic = lowerPrompt.includes('salicylic') || lowerPrompt.includes('bha');
          const hasGlycolic = lowerPrompt.includes('glycolic') || lowerPrompt.includes('aha');
          const hasNiacinamide = lowerPrompt.includes('niacinamide');
          const hasHyaluronic = lowerPrompt.includes('hyaluronic');

          const isOily = lowerPrompt.includes('skin type: oily');
          const isDry = lowerPrompt.includes('skin type: dry');
          const isAcne = lowerPrompt.includes('concern: acne') || lowerPrompt.includes('breakouts');
          const isSensitive = lowerPrompt.includes('sensitive') || lowerPrompt.includes('irritated');

          // Extract product names for a "better" explanation
          const products = prompt.match(/- (.*?):/g)?.map(p => p.replace('- ', '').replace(':', '').trim()) || [];
          const mainProduct = products[0] || "your products";

          // --- NEW: SENSITIVITY TO INDIVIDUAL SCORES ---
          // Extract safety scores: (Current Safety: 10/100, Verdict: Danger)
          const safetyScores = [...prompt.matchAll(/Current Safety: (\d+)\/100/g)].map(m => parseInt(m[1]));
          const minIndividualScore = safetyScores.length > 0 ? Math.min(...safetyScores) : 100;
          const hasDangerVerdict = prompt.toLowerCase().includes('verdict: danger') || prompt.toLowerCase().includes('verdict: avoid');

          let score = 91 + (Math.random() * 6).toFixed(1) * 1;
          let verdict = "Safe";
          let explanation = `Your routine with ${mainProduct} is well-structured. No major interactions were found between your chosen actives.`;
          let tips = ["Consistency is key — maintain this routine for at least 4 weeks to see results."];

          // Logic for specific "better" explanations...
          if (hasSalicylic && isAcne) {
            score = 96.5;
            verdict = "Targeted";
            explanation = `Excellent routine for your acne concerns! The Salicylic Acid in your routine will effectively penetrate pores to clear sebum and prevent future breakouts.`;
            tips.push("Apply your salicylic treatment directly after cleansing for maximum penetration.");
          }

          // [CRITICAL] Apply Individual Product Veto
          if (minIndividualScore < 40 || hasDangerVerdict) {
            score = Math.min(score, minIndividualScore + 15); // Heavily penalize
            verdict = minIndividualScore < 20 ? "Avoid" : "Use with Caution";
            explanation = `Your overall routine is compromised because it contains one or more products flagged as High Risk (Safety Score: ${minIndividualScore}%). Even if other products are safe, this ingredient mix risks severe irritation.`;
            tips = ["Remove the flagged high-risk product immediately.", "Swap the risky product for a dermatologist-approved alternative from your scan history."];
          }
          else if (hasVitC && hasRetinol && lowerPrompt.includes('morning')) {
            score = 62.4;
            verdict = "Caution Recommended";
            explanation = `Layering Vitamin C and Retinol together in the morning is generally not recommended for your profile. This combination increases sensitivity and may cause redness.`;
            tips = ["Move Retinol to your night routine.", "Ensure you apply a high-SPF sunscreen daily when using Vitamin C."];
          }
          // Conflict: Multiple strong acids + Retinol
          else if ((hasSalicylic || hasGlycolic) && hasRetinol) {
            score = 48.2;
            verdict = "High Irritation Risk";
            explanation = `Your routine combines strong chemical exfoliants with Retinol. This aggressive pairing is likely to compromise your skin's moisture barrier, leading to irritation.`;
            tips = ["Alternate your actives: Exfoliate on Monday/Thursday, use Retinol on other nights.", "Use a ceramid-rich recovery cream to support your skin barrier."];
          }
          // Benefit: Dry + Hyaluronic
          else if (hasHyaluronic && isDry) {
            score = 98.2;
            verdict = "Highly Compatible";
            explanation = `This is a perfect routine for dry skin. The Hyaluronic Acid provides deep hydration, while your other products lock that moisture in effectively.`;
            tips.push("Apply your hyaluronic serum to slightly damp skin to enhance its moisture-binding efficiency.");
          }

          // --- END MOCK REASONING ENGINE ---

          return {
            text: JSON.stringify({ score, verdict, explanation, tips })
          };
        }

        // Handle Chatbot Prompt
        // ─── DROP-IN REPLACEMENT for the chatbot block inside runanywhere.js ───────────
        // Replace the block that starts with:
        //   if (prompt.includes('clinical dermatologist') && prompt.includes('USER QUESTION')) {
        // ...with this entire block.

        if (prompt.includes('ASSISTANT RESPONSE:') || prompt.includes('IMPROVED RESPONSE:')) {
          console.log('[RunAnywhere Mock] Chatbot inference triggered.');
          await new Promise(resolve => setTimeout(resolve, 900));

          // ── Extract profile fields ──────────────────────────────────────────────────
          const skinType = (prompt.match(/Skin Type\s*:\s*(.+)/i) || [])[1]?.trim().toLowerCase() || 'normal';
          const concerns = (prompt.match(/Concerns\s*:\s*(.+)/i) || [])[1]?.trim().toLowerCase() || '';
          const sensitivities = (prompt.match(/Sensitivities\s*:\s*(.+)/i) || [])[1]?.trim().toLowerCase() || '';
          const actives = (prompt.match(/Active Ingredients Currently In Use\s*:\s*(.+)/i) || [])[1]?.trim().toLowerCase() || '';
          const reactivity = (prompt.match(/Reactivity\s*:\s*(.+)/i) || [])[1]?.trim().toLowerCase() || 'normal';

          const questionMatch = prompt.match(/USER QUESTION:\s*"([\s\S]*?)"/i);
          const question = questionMatch ? questionMatch[1].trim().toLowerCase() : '';

          // ── Helper: does the question mention X? ────────────────────────────────────
          const asks = (...keywords) => keywords.some(k => question.includes(k));
          const profileHas = (...keywords) => keywords.some(k =>
            [skinType, concerns, sensitivities, actives, reactivity].some(field => field.includes(k))
          );

          // ── Build a context-aware response ──────────────────────────────────────────
          let reply = '';

          // --- Niacinamide queries ---
          if (asks('niacinamide')) {
            if (sensitivities.includes('niacinamide')) {
              reply = `Niacinamide is listed in your sensitivity profile, so proceed with caution. Even though it's well-tolerated by most, your reported sensitivity means you should patch-test a 2% formulation for 7 days before applying it to your full face. Discontinue if you notice flushing or itching.`;
            } else if (skinType.includes('oily') || concerns.includes('pore') || concerns.includes('sebum')) {
              reply = `Niacinamide is a strong match for your ${skinType} skin and ${concerns || 'current concerns'}. At 5–10%, it visibly reduces sebum production and minimises pore appearance within 4–8 weeks. It also reinforces your barrier, which is useful if you're running any active like ${actives || 'exfoliants'} that could cause dryness. No interaction risks with your current actives.`;
            } else if (skinType.includes('dry')) {
              reply = `Niacinamide works well for dry skin — it boosts ceramide synthesis, which directly strengthens a compromised moisture barrier. Given your dry skin type, pair it with a humectant (hyaluronic acid) underneath and an occlusive on top so it doesn't sit on a dehydrated surface. Your current actives (${actives || 'none listed'}) don't conflict with it.`;
            } else {
              reply = `Niacinamide is generally safe for ${skinType} skin with no noted interactions against your profile (Actives: ${actives || 'none'}, Sensitivities: ${sensitivities || 'none'}). Start at 5% concentration. The only pairing to avoid is high-dose Vitamin C (≥ 15%) in the same step — they can temporarily form a yellow complex, reducing efficacy of both.`;
            }
          }

          // --- Retinol queries ---
          else if (asks('retinol', 'retinoid', 'tretinoin')) {
            const usesAcids = actives.match(/salicylic|glycolic|aha|bha|lactic/);
            const usesVitC = actives.match(/vitamin c|ascorbic/);

            if (reactivity.includes('high') || sensitivities.includes('retinol')) {
              reply = `Your profile flags high reactivity${sensitivities.includes('retinol') ? ' and a listed retinol sensitivity' : ''}. Retinoids are still usable, but start at 0.025% retinol (not tretinoin) just twice a week, using the sandwich method: moisturiser → retinol → moisturiser. Do not introduce any other new active while doing so.`;
            } else if (usesAcids && usesVitC) {
              reply = `Caution: your current actives include both chemical exfoliants (${usesAcids[0]}) and Vitamin C. Adding retinol creates a triple active load that is very likely to cause barrier damage on ${skinType} skin. Recommended schedule: Vitamin C in the morning, retinol 3×/week at night on non-exfoliant nights, never all three on the same evening.`;
            } else if (usesAcids) {
              reply = `You're currently using ${usesAcids[0]}, which can't be layered with retinol on the same night — the combined pH disruption and cell-turnover acceleration causes irritation. Alternate nights: exfoliant one night, retinol the next. Given your ${skinType} skin, also apply a ceramide moisturiser after retinol to buffer transepidermal water loss.`;
            } else {
              reply = `Retinol is compatible with your current profile (${skinType} skin, actives: ${actives || 'none'}). Introduce it at 0.1–0.3% two nights per week, stepping up frequency over 6–8 weeks. The main risk to monitor: retinol accelerates cell turnover and temporarily thins your skin's outer layer, so daily SPF 30+ is non-negotiable while using it.`;
            }
          }

          // --- Vitamin C queries ---
          else if (asks('vitamin c', 'ascorbic', 'l-ascorbic')) {
            const usesRetinol = actives.match(/retinol|retinoid|tretinoin/);
            const usesNiacinamide = actives.match(/niacinamide/);

            if (usesRetinol) {
              reply = `You're currently using a retinoid. Layering Vitamin C and retinol in the same routine step is not recommended — they operate at opposite pH levels and together increase photosensitivity significantly. Use Vitamin C in the morning and your retinoid at night. Both will remain effective.`;
            } else if (usesNiacinamide) {
              reply = `Both Vitamin C and Niacinamide are in your routine. The old concern that they form nicotinic acid (flushing) is largely a myth at room temperature and modern formulations, but to maximise efficacy apply them 20–30 minutes apart, or use Vitamin C in the AM and Niacinamide in the PM. This also prevents any pH interference.`;
            } else {
              reply = `Vitamin C (L-Ascorbic Acid) is a good fit for your ${skinType} skin targeting ${concerns || 'general maintenance'}. Choose a pH-stabilised formula (pH 2.5–3.5) at 10–15% for efficacy without excessive irritation. Apply in the morning before SPF — Vitamin C and UV filters work synergistically. No conflicts with your listed actives (${actives || 'none'}).`;
            }
          }

          // --- SPF / sunscreen queries ---
          else if (asks('sunscreen', 'spf', 'sun', 'uv')) {
            if (skinType.includes('oily') || concerns.includes('acne') || concerns.includes('breakout')) {
              reply = `For ${skinType} skin with ${concerns || 'your concerns'}, use a non-comedogenic, oil-free chemical sunscreen (avobenzone/tinosorb base) or a micronised zinc oxide mineral formula. Avoid sunscreens with occlusive emollients like coconut oil or isopropyl myristate — these will exacerbate congestion. SPF 50 PA+++ is the minimum if you're using actives like ${actives || 'any exfoliants or retinoids'}.`;
            } else if (skinType.includes('dry')) {
              reply = `Dry skin benefits from a hydrating SPF base — look for sunscreens that contain hyaluronic acid, glycerin, or squalane alongside their UV filters. Avoid alcohol-heavy spray sunscreens; they evaporate water from already-dry skin. If you're using ${actives || 'any actives'}, SPF 50 is important since most actives increase photosensitivity.`;
            } else {
              reply = `SPF 30 minimum, SPF 50 recommended given your active use of ${actives || 'skincare actives'}. For ${skinType} skin, both mineral and chemical sunscreens are appropriate. The most important thing is daily application (every 2 hours in direct sun) — the best SPF is the one you'll actually wear consistently.`;
            }
          }

          // --- Moisturiser queries ---
          else if (asks('moisturizer', 'moisturiser', 'hydrate', 'hydration', 'cream', 'lotion')) {
            if (skinType.includes('oily')) {
              reply = `For oily skin targeting ${concerns || 'oil control'}, use a lightweight gel-cream or gel moisturiser with humectants (hyaluronic acid, glycerin) rather than heavy emollients. These bind water without adding lipid load. Avoid anything containing mineral oil, petrolatum, or lanolin as the primary base — they're occlusive in a way that congests oily skin. Your current actives (${actives || 'none'}) don't change this.`;
            } else if (skinType.includes('dry')) {
              reply = `Dry skin needs a two-part approach: a humectant (hyaluronic acid, urea) to draw in water, then an occlusive/emollient layer (shea butter, ceramides, squalane) to lock it in. Apply while skin is still slightly damp. If you're using ${actives?.includes('retinol') ? 'retinol' : actives || 'exfoliating actives'}, a ceramide-rich moisturiser is especially important to prevent barrier disruption.`;
            } else {
              reply = `For ${skinType} skin with ${concerns || 'your profile'}, a balanced moisturiser with ceramides + a light humectant is the baseline. Apply as the second-to-last step (before SPF in AM, final step in PM). The key thing to check: your actives (${actives || 'none listed'}) — if using retinoids or acids, a thicker ceramide cream at night will compensate for increased transepidermal water loss.`;
            }
          }

          // --- Layering / routine order queries ---
          else if (asks('order', 'routine', 'layer', 'step', 'before', 'after', 'when to apply')) {
            reply = `Standard layering rule for ${skinType} skin with your actives (${actives || 'none listed'}): apply products thinnest to thickest, with pH-sensitive actives (Vitamin C, AHAs, BHAs) going first on clean dry skin, then serums, then moisturiser, then SPF (AM only). ${actives?.includes('retinol') ? 'Your retinol goes on after moisturiser or between two moisturiser layers (sandwich method) to buffer irritation.' : ''} ${actives?.match(/vitamin c|ascorbic/) ? 'Vitamin C should always be your first active in AM routines.' : ''}`.trim();
          }

          // --- Acne / breakout queries ---
          else if (asks('acne', 'breakout', 'pimple', 'spot', 'clog')) {
            if (sensitivities.includes('salicylic') || sensitivities.includes('bha')) {
              reply = `Your profile lists a sensitivity to salicylic acid (BHA), which is the standard acne active. Alternatives that are effective and safer for your sensitivity: azelaic acid (15–20%) which targets P. acnes bacteria and reduces inflammation without the BHA irritation mechanism, and benzoyl peroxide (2.5%) as a spot treatment only. Avoid physical scrubs — they spread bacteria and cause microtears.`;
            } else if (skinType.includes('dry')) {
              reply = `Acne on dry skin is often barrier-disruption acne rather than sebum-excess acne. Aggressive actives like high-dose salicylic acid will worsen it. Use low-concentration BHA (0.5–1% salicylic) or niacinamide as your primary treatment, focus heavily on barrier repair (ceramides, no SLS cleansers), and avoid the impulse to over-exfoliate — that cycle worsens this acne type.`;
            } else {
              reply = `For ${skinType} skin and acne concerns: salicylic acid (1–2%) addresses sebum congestion by being oil-soluble and penetrating pores directly. Pair it with niacinamide for anti-inflammatory support. Avoid occlusive ingredients (coconut oil, isopropyl myristate). Your current actives (${actives || 'none'}) — ${actives?.includes('niacinamide') ? 'niacinamide is already a good call' : 'consider adding niacinamide to your PM routine'}.`;
            }
          }

          // ── Profile-aware fallback (catches everything not matched above) ────────────
          else {
            const activesNote = actives
              ? `Since you're currently using ${actives}, check for any pH conflicts or overlapping mechanisms before adding a new ingredient.`
              : `You have no current actives on file, so introducing a new ingredient carries lower interaction risk.`;

            const sensitivityNote = sensitivities && sensitivities !== 'none stated'
              ? `Important: your listed sensitivities include ${sensitivities} — confirm the new product or ingredient is free of these.`
              : '';

            reply = [
              `Based on your profile (${skinType} skin, concerns: ${concerns || 'none listed'}, reactivity: ${reactivity}):`,
              ``,
              `${activesNote}`,
              sensitivityNote,
              ``,
              `For a more specific answer to "${question}", share the product name, ingredient list, or the exact active you're asking about. That lets me evaluate compatibility against your profile precisely rather than generally.`,
            ].filter(Boolean).join('\n');
          }

          return { text: reply };
        }
        // ─────────────────────────────────────────────────────────────────────────────

        // Simulate inference latency
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Simulated LLM Intelligence - Profile-Aware Logic

        const inputMatch = prompt.match(/INPUT TEXT \(Potentially noisy OCR scan\):\s*"([\s\S]*?)"/i);
        const rawInput = inputMatch ? inputMatch[1] : "";

        // Extract Profile context from prompt
        const skinTypeRaw = (prompt.match(/- Skin Type:\s*(.*)/i) || [])[1]?.trim() || "normal";
        const skinType = skinTypeRaw.toLowerCase();
        const concerns = (prompt.match(/- Specific Concerns:\s*(.*)/i) || [])[1]?.trim() || "";
        const sensitivities = (prompt.match(/- Sensitivities:\s*(.*)/i) || [])[1]?.trim() || "";
        const actives = (prompt.match(/- Current Actives:\s*(.*)/i) || [])[1]?.trim() || "";
        const reactivity = (prompt.match(/- Reactivity:\s*(.*)/i) || [])[1]?.trim() || "Normal";

        // Clean raw input by removing stuff before 'ingredients' and admin blurbs at the end
        let cleanedInput = rawInput;
        const ingMatch = cleanedInput.match(/ingredients\s*[:\-]?\s*(.*)/i);
        if (ingMatch) {
          cleanedInput = ingMatch[1];
        }
        cleanedInput = cleanedInput.replace(/(mrp|net wt|mfg|made in|lic|unit|toll free|customer care).*$/i, '');

        // Split and filter ingredients
        const parsedIngs = cleanedInput
          .split(/[,;\n•|]/)
          .map(s => s.trim().replace(/[®™©*.]/g, ''))
          .filter(s => s.length > 2 && /[a-zA-Z]/.test(s) && !/^(mrp|net|mfg|lic|unit|rs|incl)/i.test(s));

        console.log(`[AI Agent] Clinical Analysis for Profile: ${skinType} | Concerns: ${concerns}`);

        const ingredients = parsedIngs.map(name => {
          const lower = name.toLowerCase();
          let risk = "low";
          let safety_status = "Safe";
          let benefit = "Skin conditioning agent";
          let warning = null;
          
          const lowerSensitivities = sensitivities.toLowerCase();
          
          const heavyOils = /coconut|mineral oil|petrolatum|shea butter|isopropyl myristate|lanolin/i;
          const humectants = /hyaluronic|glycerin|squalane|ceramide|panthenol/i;
          const harshSurfactants = /sulfate|sls|sles|paraben/i;
          const acneActives = /salicylic|niacinamide|zinc|tea tree/i;

          // Check Heavy Oils
          if (heavyOils.test(lower)) {
              if (skinType === 'oily' || concerns.includes('acne')) {
                  risk = "high";
                  safety_status = "Danger";
                  benefit = "Occlusive agent";
                  warning = `Highly comedogenic for oily/acne-prone skin. Strong risk of clogged pores.`;
              } else if (skinType === 'dry') {
                  benefit = "Rich occlusive moisture (Ideal for Dry Skin)";
                  safety_status = "Safe";
              } else {
                  benefit = "Emollient/Occlusive";
              }
          }
          // Check Humectants
          else if (humectants.test(lower)) {
              if (skinType === 'dry') {
                 benefit = "Deep hydration and barrier repair (Ideal for Dry Skin)";
              } else {
                 benefit = "Lightweight hydration";
              }
          }
          // Check Harsh Surfactants & Preservatives
          else if (harshSurfactants.test(lower)) {
              risk = "high";
              safety_status = "Danger";
              benefit = "Cleansing agent/preservative";
              warning = `Aggressive and stripping for ${skinType} skin.`;
          }
          // Check Alcohols
          else if (/alcohol/.test(lower) && !/cetyl|cetearyl|stearyl/.test(lower)) {
              const isDrying = /denat|ethanol|isopropyl/.test(lower) || lower === 'alcohol';
              if (isDrying && (skinType === 'dry' || lowerSensitivities.includes('alcohol') || skinType === 'sensitive')) {
                  risk = "high";
                  safety_status = "Danger";
                  benefit = "Solvent / Astringent";
                  warning = `CRITICAL: Severe dehydration and barrier damage risk for ${skinType} profile.`;
              } else if (isDrying) {
                  risk = "moderate";
                  safety_status = "Caution";
                  benefit = "Penetration enhancer";
                  warning = `Can be drying with frequent use.`;
              } else {
                  benefit = "Texture enhancer";
              }
          }
          // Check Strong Exfoliants/Acids/Retinoids
          else if (/acid|glycol|retin|oxide|peroxide/.test(lower) && !/hyaluronic|amino|fatty|ascorbic/.test(lower)) {
              if (skinType === 'dry' || skinType === 'sensitive' || lowerSensitivities.includes('acid')) {
                  risk = "high";
                  safety_status = "Danger";
                  benefit = "Active exfoliant/renewal";
                  warning = `High risk of irritation, redness, and barrier damage for ${skinType} skin.`;
              } else {
                  risk = "moderate";
                  safety_status = "Caution";
                  benefit = `Targeted active for renewal`;
                  warning = `May cause sensitivity. Monitor usage.`;
              }
          }
          // Check Fragrance
          else if (/parfum|fragrance|linalool|limonene/.test(lower)) {
             if (lowerSensitivities.includes('fragrance') || skinType === 'sensitive') {
                risk = "high";
                safety_status = "Danger";
                benefit = "Scent component";
                warning = `CONFLICT: Profile sensitive to Fragrance.`;
             } else {
                risk = "moderate";
                safety_status = "Caution";
                benefit = "Fragrance";
                warning = `Potential allergen/sensitizer.`;
             }
          }
          // Check Acne Actives
          else if (acneActives.test(lower)) {
             if (skinType === 'oily' || concerns.includes('acne')) {
                 benefit = "Sebum control and pore clearing (Ideal for Oily/Acne)";
             } else if (skinType === 'dry' && /salicylic|tea tree/.test(lower)) {
                 risk = "moderate";
                 safety_status = "Caution";
                 benefit = "Pore clearing";
                 warning = "Can be overly drying for dry skin.";
             } else {
                 benefit = "Targeted treatment";
             }
          }

          if (lowerSensitivities.includes(lower) && safety_status !== 'Danger') {
             risk = "high";
             safety_status = "Danger";
             warning = `CONFLICT: Prohibited by user profile (${sensitivities}).`;
          }

          return { name, benefit, risk, warning, safety_status };
        });

        const dangerousCount = ingredients.filter(i => i.safety_status === 'Danger').length;
        const cautionCount = ingredients.filter(i => i.safety_status === 'Caution').length;
        const hasAvoided = ingredients.some(i => i.warning && i.warning.includes('CONFLICT'));

        let finalScore = 100;
        
        // Strict Veto Logic: Safe ingredients DO NOT cancel out Dangerous ones.
        if (dangerousCount > 0 || hasAvoided) {
            // Instant veto: cap score heavily below 40.
            finalScore = Math.min(35, 100 - (dangerousCount * 40));
        } else if (cautionCount > 0) {
            // Caution cap
            finalScore = Math.min(65, 100 - (cautionCount * 15));
        } else {
            // Only reduce from 100 slightly if everything is entirely safe
            finalScore = 100;
        }

        finalScore = Math.max(10, Math.min(100, finalScore));


        let verdict = "Safe";
        if (finalScore < 40) verdict = "Avoid";
        else if (finalScore < 70) verdict = "Caution";
        else if (finalScore < 85) verdict = "Mostly Safe";

        const mockJSON = {
          score: finalScore,
          verdict,
          ingredients,
          warnings: ingredients.filter(i => i.safety_status !== 'Safe').map(i => ({
            ingredient: i.name,
            message: i.warning,
            severity: i.safety_status === 'Danger' ? 'high' : 'moderate'
          })),
          explanation: `Clinical analysis complete. Product suitability for ${skinType} skin is ${finalScore}%. ${dangerousCount > 0 ? 'Critical conflicts detected with your sensitivities.' : 'Generally safe formulation.'}`
        };

        return {
          text: JSON.stringify(mockJSON)
        };
      }
    };
  }
};
