// Simple prompt template engine for Turn Toon and other features
// Supports: [[var]] with filters: upper, lower, title, join:sep, if:text, ifelse:yes:no,
// omit:value, prefix:text ,skipIfEmpty, suffix:text ,skipIfEmpty

export function renderTemplate(
  tpl: string,
  vars: Record<string, unknown>,
): { output: string; errors: string[] } {
  const errors: string[] = []
  if ((tpl.match(/\[\[/g) || []).length !== (tpl.match(/\]\]/g) || []).length) {
    errors.push("Unbalanced [[ ]] placeholders.")
  }

  const unknowns = Array.from(tpl.matchAll(/\[\[(.+?)\]\]/g))
    .map((m) => m[1].split("|")[0].trim())
    .filter((name) => name && !(name in vars))
  const uniqUnknowns = Array.from(new Set(unknowns))
  if (uniqUnknowns.length) {
    errors.push("Unknown variables: " + uniqUnknowns.join(", "))
  }

  const output = tpl.replace(/\[\[(.+?)\]\]/g, (_, inner) => {
    const [rawName, ...rawFilters] = inner.split("|").map((s: string) => s.trim())
    let val: unknown = (vars as any)[rawName]
    let visible = true

    const applyFilter = (f: string) => {
      const [name, ...argsRaw] = f.split(":")
      const args = argsRaw.length ? argsRaw.join(":") : ""
      switch (name) {
        case "upper":
          val = toStr(val).toUpperCase()
          break
        case "lower":
          val = toStr(val).toLowerCase()
          break
        case "title":
          val = toStr(val).replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
          break
        case "join": {
          const sep = args?.length ? args : ", "
          if (Array.isArray(val)) val = (val as any[]).join(sep)
          else val = toStr(val)
          break
        }
        case "if": {
          const text = args ?? ""
          val = truthy(val) ? text : ""
          break
        }
        case "ifelse": {
          const [yes, no = ""] = splitArgs(args)
          val = truthy(val) ? yes : no
          break
        }
        case "omit": {
          const omitVal = args ?? ""
          if (toStr(val) === omitVal) {
            val = ""
            visible = false
          }
          break
        }
        case "prefix": {
          const [text = "", skipFlag = "false"] = splitArgs(args)
          if (skipFlag === "true" && empty(val)) break
          val = empty(val) ? "" : text + toStr(val)
          break
        }
        case "suffix": {
          const [text = "", skipFlag = "false"] = splitArgs(args)
          if (skipFlag === "true" && empty(val)) break
          val = empty(val) ? "" : toStr(val) + text
          break
        }
        default:
          if (!errors.find((e) => e.includes("Unknown filter"))) {
            errors.push(`Unknown filter on [[${rawName}]]: ${name}`)
          }
      }
    }

    rawFilters.forEach(applyFilter)
    return visible ? toStr(val) : ""
  })

  const tidied = output
    .replace(/\s+([,.!?:;])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+\./g, ".")
    .trim()

  return { output: tidied, errors }
}

export function splitArgs(s?: string) {
  return (s ?? "").split(",").map((x) => x.trim())
}
export function toStr(v: unknown) {
  if (v === null || v === undefined) return ""
  if (Array.isArray(v)) return (v as any[]).join(", ")
  return String(v)
}
export function truthy(v: unknown) {
  if (Array.isArray(v)) return (v as any[]).length > 0
  return !!v && v !== "false" && v !== "0"
}
export function empty(v: unknown) {
  if (Array.isArray(v)) return (v as any[]).length === 0
  return v === null || v === undefined || v === ""
}
