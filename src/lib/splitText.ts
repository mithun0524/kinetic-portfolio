/**
 * Free text splitter — no paid GSAP SplitText plugin required.
 * Wraps each word (and optionally each char) in spans so they can be
 * animated independently. Preserves spaces and is reversible via the
 * returned cleanup function.
 */

export interface SplitResult {
  chars: HTMLElement[]
  words: HTMLElement[]
  /** Restore the original text content. */
  revert: () => void
}

export type SplitType = 'chars' | 'words' | 'lines'

export function splitText(
  el: HTMLElement,
  type: SplitType = 'chars'
): SplitResult {
  const original = el.innerHTML
  const source = el.textContent ?? ''
  const words: HTMLElement[] = []
  const chars: HTMLElement[] = []

  el.innerHTML = ''
  el.setAttribute('aria-label', source)

  const rawWords = source.split(/(\s+)/) // keep whitespace tokens

  for (const token of rawWords) {
    if (token.trim() === '') {
      el.appendChild(document.createTextNode(token))
      continue
    }

    const wordEl = document.createElement('span')
    wordEl.className = 'split-word'
    wordEl.style.display = 'inline-block'
    wordEl.setAttribute('aria-hidden', 'true')

    if (type === 'chars') {
      for (const ch of Array.from(token)) {
        const charEl = document.createElement('span')
        charEl.className = 'split-char'
        charEl.style.display = 'inline-block'
        charEl.textContent = ch
        wordEl.appendChild(charEl)
        chars.push(charEl)
      }
    } else {
      wordEl.textContent = token
    }

    words.push(wordEl)
    el.appendChild(wordEl)
  }

  return {
    chars,
    words,
    revert: () => {
      el.innerHTML = original
      el.removeAttribute('aria-label')
    },
  }
}
