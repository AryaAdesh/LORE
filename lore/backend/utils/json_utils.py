import json
import re


def extract_json(raw: str):
    """Robustly extract the first JSON object or array from an LLM response.
    Uses JSONDecoder.raw_decode() which stops exactly at the end of valid JSON,
    handling fences, preambles, trailing text, and trailing commas.
    """
    raw = raw.strip()
    # Strip markdown code fences
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()

    decoder = json.JSONDecoder()

    # Find which JSON start character appears FIRST (could be array [ or object {)
    obj_idx = raw.find('{')
    arr_idx = raw.find('[')

    # Determine order to try
    if obj_idx == -1 and arr_idx == -1:
        return json.loads(raw)  # will fail with a clear error

    if arr_idx == -1 or (obj_idx != -1 and obj_idx < arr_idx):
        order = [obj_idx, arr_idx]
    else:
        order = [arr_idx, obj_idx]

    for idx in order:
        if idx == -1:
            continue
        try:
            obj, _ = decoder.raw_decode(raw, idx)
            return obj
        except json.JSONDecodeError:
            # Try removing trailing commas and retry
            candidate = raw[idx:]
            candidate = re.sub(r',\s*([}\]])', r'\1', candidate)
            try:
                obj, _ = decoder.raw_decode(candidate)
                return obj
            except json.JSONDecodeError:
                continue

    return json.loads(raw)
