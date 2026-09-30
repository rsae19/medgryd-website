"""Copy the shared nav and footer from index.html into every other page.

The site has no build step, so the nav and footer live in index.html between
<!--NAV:START--> / <!--NAV:END--> and <!--FOOTER:START--> / <!--FOOTER:END-->.
Edit them there, then run:  python tools/stamp.py
Each page gets aria-current="page" on its own nav link.
"""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = ["features.html", "schools.html", "pricing.html", "about.html", "contact.html",
         "privacy.html", "terms.html", "dpa.html"]


def block(src, name):
    m = re.search(rf"<!--{name}:START-->.*?<!--{name}:END-->", src, re.S)
    if not m:
        raise SystemExit(f"index.html is missing the {name} block")
    return m.group(0)


def main():
    index = (ROOT / "index.html").read_text(encoding="utf-8")
    nav, footer = block(index, "NAV"), block(index, "FOOTER")
    for page in PAGES:
        path = ROOT / page
        src = path.read_text(encoding="utf-8")
        page_nav = nav.replace('data-page="home"', f'data-page="{page[:-5]}"')
        page_nav = page_nav.replace(f'href="{page}">', f'href="{page}" aria-current="page">')
        for name, repl in (("NAV", page_nav), ("FOOTER", footer)):
            if f"<!--{name}:START-->" not in src:
                raise SystemExit(f"{page} is missing the {name} placeholder")
            src = re.sub(rf"<!--{name}:START-->.*?<!--{name}:END-->", lambda _m: repl, src, flags=re.S)
        path.write_text(src, encoding="utf-8")
        print("stamped", page)


if __name__ == "__main__":
    main()
