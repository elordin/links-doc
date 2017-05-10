const CLOSED_CLASS_NAME = 'closed';
const STATE_STORAGE_KEY = 'openState';
const XHR_READY = 4;
const HTTP_OK = 200;
const KEYCODE_ENTER = 13;
const DEFAULT_URL = 'example.json';


/**
 * Generate an ID string
 * @param {String} str ID string
 * @param {String} prefix Optional ID prefix
 * @param {String} prefix Optional ID suffix
 * @returns {String} Encoded ID string
 */
function makeId (str, prefix, suffix) {
  return `${prefix || ''}${str}${suffix || ''}`
    .replace(/[^A-Za-z0-9\-]/g, ' ')
    .trim()
    .replace(/ +/g, '-')
    .substr(0, 64)
    .toLowerCase();
}


/**
 * Generates and appends the code representation of a doc node and some navigation elements
 */
function generateCodeInfo (container, prefix, id, code, sourceUrl, desc) {

  function formatTypeStr (str) {
    return str
      .replace(/\s[^\w]+\s/g, (m) => `<span class="tok-op">${m}</span>`)
      .replace(/\s[^\w]+$/g, (m) => `<span class="tok-op">${m}</span>`)
      .replace(/\btypename|sig|var\b/g, (m) => `<span class="tok-keyword">${m}</span>`)
      .replace(/\b[A-Z][\w]+\b/g, (m) => `<span class="tok-typename">${m}</span>`);
  }

  const header = document.createElement('div');
  header.classList.add(`${prefix}-header`, 'def-header');

  const anchor = document.createElement('a');
  anchor.classList.add('anchor');
  anchor.href = `#${id}`;
  anchor.innerHTML = '<i class="fa fa-link"></i>';

  const codeElem = document.createElement('code');
  codeElem.classList.add(`${prefix}-def`, 'def');

  codeElem.innerHTML = formatTypeStr(code);

  const sourceLink = document.createElement('a');
  sourceLink.href = sourceUrl;
  sourceLink.innerText = 'Source';

  header.appendChild(anchor);
  header.appendChild(codeElem);
  header.appendChild(sourceLink);

  container.appendChild(header);

  if (desc) {
    const descElem = document.createElement('div');
    descElem.classList.add(`${prefix}-desc`, 'desc')
    descElem.innerText = desc;
    container.appendChild(descElem);
  }

  container.id = id;
  return container;
}


/**
 * Generate the documentation markup from the passed definitions-object
 * @param {Object} defObj Definition of the module
 */
function generateModuleDef (container, defObj) {
  generateModuleHeader(container, defObj);
  generateSubmodules(container, defObj);
  generateTypes(container, defObj);
  generateFunctions(container, defObj);
  generateConstants(container, defObj);
}


/**
 * Generates a section with title to fill with doc info
 *
 * @param {String} title
 */
function makeSection (title) {
  const section = document.createElement('section');
  const h3 = document.createElement('h3');
  const toggleBtn = document.createElement('button');
  const titleText = document.createTextNode(title);

  toggleBtn.classList.add('open-toggle');
  toggleBtn.classList.add('fa');

  h3.appendChild(toggleBtn);
  h3.appendChild(titleText);
  section.appendChild(h3);

  return section;
}


/**
 * Generate the module documentation header
 *
 * @param {HTMLElement} container
 * @param {Object} data
 */
function generateModuleHeader (container, data) {
  const moduleHeader = document.createElement('div');
  moduleHeader.classList.add('module-header');
  const moduleDesc = document.createElement('div');
  moduleDesc.classList.add('module-desc');
  const moduleName = document.createElement('h2');
  moduleName.classList.add('module-name');
  moduleName.innerText = data.name;
  const moduleDescText = document.createElement('p');
  moduleDescText.innerText = data.desc;
  moduleDesc.appendChild(moduleName);
  moduleDesc.appendChild(moduleDescText);
  moduleHeader.appendChild(moduleDesc);
  container.appendChild(moduleHeader);
  generateMetaTable(moduleHeader, data);
}


/**
 * Generate meta-data table
 *
 * @param {HTMLElement} container
 * @param {Object} data
 */
function generateMetaTable(container, data) {
  const table = document.createElement('table');
  table.classList.add('module-meta');
  const metaData = data.meta;

  Object.keys(metaData).forEach(k => {
    const tr = document.createElement('tr');
    const th = document.createElement('th');
    const td = document.createElement('td');
    th.innerText = k;
    td.innerText = metaData[k];
    tr.appendChild(th);
    tr.appendChild(td);
    table.appendChild(tr);
  });

  container.appendChild(table);
}


/**
 * Generate submodule documentation
 * @param {HTMLElement} container Container to append to
 * @param {Object} data Defintion of the module
 */
function generateSubmodules (container, data) {
  const submodules = data.subModules;
  const moduleSection = makeSection('Modules');
  const moduleList = document.createElement('ul');
  moduleList.classList.add('module-list');

  submodules.forEach(m => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.classList.add('module-ref');
    a.innerText = m.name;
    a.href = m.url;
    li.appendChild(a);
    moduleList.appendChild(li);
  });

  moduleSection.appendChild(moduleList);
  container.appendChild(moduleSection);
}


/**
 * Generate type documentation
 * @param {HTMLElement} container Container to append to
 * @param {Object} data Defintion of the module
 */
function generateTypes(container, data) {
  const types = data.members.filter(m => m.hasOwnProperty('typeName'));
  if (!types) {
    // No types
    return;
  }

  const typeSection = makeSection('Types');

  function makeVariantType (constructors) {
    if (!constructors) {
      return '';
    }

    const ret = constructors.reduce((a, b) => a + ' ' + b + ' |', '[| ') + ']';
    return ret;
  }

  const ul = document.createElement('ul');
  types.forEach(t => {
    const id = makeId(t.typeName, 'type-');
    const li = document.createElement('li')
    const typeStr = `typename ${t.typeName} = ${t.alias || makeVariantType(t.varType)}`;
    generateCodeInfo(li, 'type', id, typeStr, t.sourceUrl, t.desc);
    ul.appendChild(li);

  });
  typeSection.appendChild(ul);

  container.appendChild(typeSection);
}


/**
 * Generate function documentation
 * @param {HTMLElement} container Container to append to
 * @param {Object} data Defintion of the module
 */
function generateFunctions (container, data) {
  const functions = data.members.filter(m => m.hasOwnProperty('funName'));
  if (!functions) {
    return;
  }
  const funSection = makeSection('Functions');
  const funList = document.createElement('ul');
  functions.forEach(f => {
    const id = makeId(f.funName, 'fun-');
    const li = document.createElement('li');
    const funStr = `sig ${f.funName} : ${f.signature}`;
    generateCodeInfo(li, 'fun', id, funStr, f.sourceUrl, f.desc);
    funList.appendChild(li);
  });

  funSection.appendChild(funList);
  container.appendChild(funSection);
}


/**
 * Generate constants documentation
 * @param {HTMLElement} container Container to append to
 * @param {Object} data Defintion of the module
 */
function generateConstants (container, data) {
  const constants = data.members.filter(m => m.hasOwnProperty('constName'));
  if (!constants) {
    return;
  }

  const constSection = makeSection('Constants');
  const constList = document.createElement('ul');
  constants.forEach(c => {
    const id = makeId(c.constName, 'const-');
    const li = document.createElement('li');
    const constStr = `var ${c.constName} : ${c.constType}` + (c.value ? ` = ${c.value}` : '');
    generateCodeInfo(li, 'fun', id, constStr, c.sourceUrl, c.desc);
    constList.appendChild(li);
  });

  constSection.appendChild(constList);
  container.appendChild(constSection);
}


/**
 * Attach event handlers and storage to toggle closing/opening of sections
 */
function attachOpenToggles () {
  var state = Array();

  try {
    state = JSON.parse(localStorage.getItem(STATE_STORAGE_KEY));
  } catch (err) {
    // w/e
  }

  const target = location.hash;

  Array.prototype.forEach.call(
    document.querySelectorAll('section > h3 button'),
    (btn, i) => {
      const section = btn.parentElement.parentElement;
      const targetInSection = (target.length > 1) && Boolean(section.querySelector(target));

      if (!targetInSection && state && state[i]) {
        section.classList.add(CLOSED_CLASS_NAME);
      }

      btn.addEventListener('click', (e) => {
        section.classList.toggle(CLOSED_CLASS_NAME);
        state[i] = section.classList.contains(CLOSED_CLASS_NAME)
        localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(state));
      });
    }
  );
}


/**
 * Display an error message
 *
 * @param {String} msg
 */
function generateErrorMessage (msg) {
  const errContainer = document.getElementById('errContainer');
  const div = document.createElement('div');
  div.classList.add('error');
  div.innerText = msg;
  errContainer.appendChild(div);

  window.setTimeout(() => {
    div.style.opacity = 0;
    div.style.top = '-1rem';
    window.setTimeout(() => {
      errContainer.removeChild(div);
    }, 500);
  }, 3000);
}


/**
 * Update the displayed documentation based on a config file loaded via AJAX
 *
 * @param {String} url
 * @returns
 */
function updateDisplayedModuleAJAX (url) {
  const moduleDefContainer = document.getElementById('moduleDef');
  if (!moduleDefContainer) {
    console.error('Cannot find module-def container. Exiting.');
    return;
  }

  while (moduleDefContainer.firstChild) {
    moduleDefContainer.removeChild(moduleDefContainer.firstChild);
  }

  const xhr = new XMLHttpRequest();
  xhr.open('GET', url);
  xhr.addEventListener('readystatechange', (e) => {
    if (xhr.readyState === XHR_READY) {
      if (xhr.status === HTTP_OK) {
        try {
          const moduleDef = JSON.parse(xhr.responseText);
          generateModuleDef(moduleDefContainer, moduleDef);
          attachOpenToggles();
        } catch (err) {
          generateErrorMessage('Failed to display module doc. Check the format.');
        }
      } else {
        generateErrorMessage('Failed to load module doc.');
      }
    }
  });
  xhr.send();
}


/**
 * Update the displayed documentation based on the file-upload input
 *
 * @returns
 */
function updateDisplayedModuleFile () {
  const moduleDefContainer = document.getElementById('moduleDef');
  if (!moduleDefContainer) {
    console.error('Cannot find module-def container. Exiting.');
    return;
  }

  while (moduleDefContainer.firstChild) {
    moduleDefContainer.removeChild(moduleDefContainer.firstChild);
  }

  var fileUploadElem = document.getElementById("configFileupload")
  var file = fileUploadElem.files[0];
  if (file) {
    var reader = new FileReader();
    reader.readAsText(file, "UTF-8");
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        generateModuleDef(moduleDefContainer, data);
        attachOpenToggles();
      } catch (err) {
        console.error(err);
        generateErrorMessage('Failed to read file. Check the format.');
      }
    }
    reader.onerror = function (evt) {
      generateErrorMessage('Failed to read file.');
    }
  } else {
    generateErrorMessage('No file provided.');
  }
}


/**
 * Initialize the page
 */
function init () {
  const loadBtn = document.getElementById('loadConfigBtn');
  const loadInput = document.getElementById('configUrl');
  const fileInput = document.getElementById("configFileupload")
  fileInput.addEventListener('change', () => {
    updateDisplayedModuleFile();
    loadInput.value = '';
  });

  loadBtn.addEventListener('click', () => {
    updateDisplayedModuleAJAX(loadInput.value);
    fileInput.value = null;
  });
  loadInput.addEventListener('keyup', (e) => {
    if (e.keyCode === KEYCODE_ENTER) {
      updateDisplayedModuleAJAX(loadInput.value);
      fileInput.value = null;
    }
  })

  updateDisplayedModuleAJAX(DEFAULT_URL);
}

