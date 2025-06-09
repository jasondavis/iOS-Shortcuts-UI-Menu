
const TagPicker = {
  init(selector, tagList, tagSets, options = {}) {
    const config = Object.assign({
      enableAlphabetView: true,
      enableSetView: true,
      defaultView: 'alphabet',
      autoSubmit: true,
      scriptName: 'ApplyTags'
    }, options);

    const container = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!container) throw new Error("Container not found");

    const selected = new Set();

    const createEl = (tag, props = {}, ...children) => {
      const el = document.createElement(tag);
      Object.entries(props).forEach(([k, v]) => {
        if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.substring(2), v);
        else if (k === "className") el.className = v;
        else el.setAttribute(k, v);
      });
      children.forEach(child => {
        if (typeof child === "string") el.appendChild(document.createTextNode(child));
        else el.appendChild(child);
      });
      return el;
    };

    container.innerHTML = "";
    const viewToggle = createEl("div", { className: "view-toggle" },
      config.enableAlphabetView && createEl("label", {},
        createEl("input", { type: "radio", name: "view", value: "alphabet", checked: config.defaultView === "alphabet" }),
        " Alphabetical View"
      ),
      config.enableSetView && createEl("label", {},
        createEl("input", { type: "radio", name: "view", value: "sets", checked: config.defaultView === "sets" }),
        " Tag Sets View"
      )
    );

    const letterToolbar = createEl("div", { className: "toolbar", id: "letterToolbar" });
    const setToolbar = createEl("div", { className: "toolbar", id: "setToolbar", style: "display:none;" });
    const tagListEl = createEl("div", { className: "tag-list", id: "tagList" });

    const updateTags = (tagSubset) => {
      tagListEl.innerHTML = "";
      tagSubset.forEach(tag => {
        const tagEl = createEl("div", {
          className: "tag" + (selected.has(tag.id) ? " selected" : ""),
          onclick: () => {
            if (selected.has(tag.id)) {
              selected.delete(tag.id);
              tagEl.classList.remove("selected");
            } else {
              selected.add(tag.id);
              tagEl.classList.add("selected");
            }
          }
        }, tag.name);
        tagListEl.appendChild(tagEl);
      });
    };

    const initAlphabetToolbar = () => {
      const letters = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];
      ["All", "0-9", ...letters].forEach(letter => {
        const btn = createEl("button", {
          onclick: () => {
            [...letterToolbar.children].forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            let filtered = tagList;
            if (letter === "0-9") {
              filtered = tagList.filter(tag => /^[0-9]/.test(tag.name));
            } else if (letter !== "All") {
              filtered = tagList.filter(tag => tag.name.toUpperCase().startsWith(letter));
            }
            updateTags(filtered);
          }
        }, letter);
        letterToolbar.appendChild(btn);
      });
    };

    const initSetToolbar = () => {
      Object.keys(tagSets).forEach(setName => {
        const btn = createEl("button", {
          onclick: () => {
            [...setToolbar.children].forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            const filtered = tagList.filter(tag => tagSets[setName].includes(tag.name));
            updateTags(filtered);
          }
        }, setName);
        setToolbar.appendChild(btn);
      });
    };

    const submitBtn = createEl("button", {
      id: "submitBtn",
      onclick: () => {
        const result = Array.from(selected).map(id => {
          const tag = tagList.find(t => t.id === id);
          return { id: tag.id, name: tag.name };
        });
        const json = encodeURIComponent(JSON.stringify(result));
        if (config.autoSubmit) {
          location.href = `scriptable:///run?scriptName=${config.scriptName}&input=${json}`;
        } else {
          console.log("Selected tags:", result);
        }
      }
    }, "Submit");

    initAlphabetToolbar();
    initSetToolbar();

    container.appendChild(viewToggle);
    container.appendChild(letterToolbar);
    container.appendChild(setToolbar);
    container.appendChild(tagListEl);
    container.appendChild(submitBtn);

    const defaultViewInput = container.querySelector(`input[name="view"][value="${config.defaultView}"]`);
    if (defaultViewInput) defaultViewInput.checked = true;

    container.querySelectorAll('input[name="view"]').forEach(radio => {
      radio.onchange = (e) => {
        if (e.target.value === "alphabet") {
          letterToolbar.style.display = '';
          setToolbar.style.display = 'none';
          letterToolbar.children[0].click();
        } else {
          setToolbar.style.display = '';
          letterToolbar.style.display = 'none';
          setToolbar.children[0].click();
        }
      };
    });

    if (config.defaultView === "alphabet") {
      letterToolbar.children[0].click();
    } else {
      setToolbar.children[0].click();
    }
  }
};

export default TagPicker;
