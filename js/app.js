// app.js - SHK Application Controller

const SHKApp = {
  data: { muscles: [], bones: [], nerves: [], joints: [], skin: [], ligaments: [] },
  searchIndex: [],

  async init() {
    // Show loading state
    document.getElementById('cy').innerHTML = '<div class="loading">データ読み込み中</div>';

    try {
      // Load data
      await this.loadData();

      // Clear loading
      document.getElementById('cy').innerHTML = '';

      // Initialize graph
      SHKGraph.init(document.getElementById('cy'));
      SHKGraph.loadData(this.data.muscles, this.data.bones, this.data.nerves, this.data.joints, this.data.skin, this.data.ligaments);

      // Validate data integrity
      const errors = SHKData.validate(this.data.muscles, this.data.bones, this.data.nerves, this.data.joints, this.data.skin, this.data.ligaments);

      // Build search index
      this.buildSearchIndex();

      // Update stats
      this.updateStats();

      // Setup event listeners
      this.setupEvents();
    } catch (err) {
      document.getElementById('cy').innerHTML = `<div class="loading" style="color:#e74c3c">データ読み込みエラー: ${err.message}</div>`;
      console.error(err);
    }
  },

  async loadData() {
    const [muscles, bones, nerves, joints, skin, ligaments] = await Promise.all([
      fetch('data/muscles.json').then(r => r.json()),
      fetch('data/bones.json').then(r => r.json()),
      fetch('data/nerves.json').then(r => r.json()),
      fetch('data/joints.json').then(r => r.json()),
      fetch('data/skin.json').then(r => r.json()),
      fetch('data/ligaments.json').then(r => r.json()),
    ]);
    this.data = { muscles, bones, nerves, joints, skin, ligaments };

    // Build lookup maps
    this.muscleMap = new Map(muscles.map(m => [m.id, m]));
    this.boneMap = new Map(bones.map(b => [b.id, b]));
    this.nerveMap = new Map(nerves.map(n => [n.id, n]));
    this.jointMap = new Map(joints.map(j => [j.id, j]));
    this.skinMap = new Map(skin.map(s => [s.id, s]));
    this.ligamentMap = new Map(ligaments.map(l => [l.id, l]));
  },

  buildSearchIndex() {
    this.searchIndex = [];

    const add = (item, type) => {
      this.searchIndex.push({
        id: item.id,
        type,
        name_ja: item.name_ja,
        name_en: item.name_en || '',
        name_latin: item.name_latin || '',
        search: `${item.name_ja} ${item.name_en || ''} ${item.name_latin || ''}`.toLowerCase(),
      });
    };

    this.data.muscles.forEach(m => add(m, 'muscle'));
    this.data.bones.forEach(b => add(b, b.structure_type === 'soft_tissue' ? 'soft_tissue' : 'bone'));
    this.data.nerves.forEach(n => add(n, 'nerve'));
    this.data.joints.forEach(j => add(j, 'joint'));
    this.data.skin.forEach(s => add(s, 'skin'));
    this.data.ligaments.forEach(l => add(l, 'ligament'));
  },

  setupEvents() {
    // Search
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');

    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim().toLowerCase();
      if (q.length < 1) {
        searchResults.classList.add('hidden');
        return;
      }
      const matches = this.searchIndex
        .filter(item => item.search.includes(q))
        .slice(0, 20);

      if (matches.length === 0) {
        searchResults.classList.add('hidden');
        return;
      }

      searchResults.innerHTML = matches.map(item => `
        <div class="search-item" data-id="${item.id}">
          <span class="type-tag" style="background:${this.getTypeBg(item.type)};color:${this.getTypeColor(item.type)}">${this.getTypeLabel(item.type)}</span>
          <span class="name-ja">${item.name_ja}</span>
          <span class="name-en">${item.name_en}</span>
        </div>
      `).join('');
      searchResults.classList.remove('hidden');

      searchResults.querySelectorAll('.search-item').forEach(el => {
        el.addEventListener('click', () => {
          SHKGraph.focusNode(el.dataset.id);
          searchResults.classList.add('hidden');
          searchInput.value = '';
        });
      });
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchResults.classList.add('hidden');
        searchInput.value = '';
      }
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-box')) {
        searchResults.classList.add('hidden');
      }
    });

    // Filters
    const filterIds = ['show-muscles', 'show-bones', 'show-soft-tissue', 'show-nerves', 'show-joints', 'show-skin', 'show-ligaments',
                       'show-origin', 'show-insertion', 'show-innervation', 'show-articulation', 'show-ligament-attach', 'show-sensory-innervation'];
    filterIds.forEach(id => {
      document.getElementById(id).addEventListener('change', () => this.applyFilters());
    });

    document.getElementById('region-filter').addEventListener('change', () => this.applyFilters());

    // Layout
    document.getElementById('relayout-btn').addEventListener('click', () => {
      const layout = document.getElementById('layout-select').value;
      SHKGraph.runLayout(layout);
    });

    // Zoom controls
    document.getElementById('zoom-in').addEventListener('click', () => {
      this.cy().zoom(this.cy().zoom() * 1.3);
    });
    document.getElementById('zoom-out').addEventListener('click', () => {
      this.cy().zoom(this.cy().zoom() / 1.3);
    });
    document.getElementById('fit-btn').addEventListener('click', () => {
      this.cy().fit(undefined, 30);
    });

    // Detail panel close
    document.getElementById('close-detail').addEventListener('click', () => {
      SHKGraph.deselectAll();
    });

    // Reverse lookup
    document.querySelectorAll('.lookup-btn').forEach(btn => {
      btn.addEventListener('click', () => this.openLookup(btn.dataset.type));
    });

    // Modal close
    document.querySelector('.modal-close').addEventListener('click', () => {
      document.getElementById('lookup-modal').classList.add('hidden');
    });
    document.getElementById('lookup-modal').addEventListener('click', (e) => {
      if (e.target.id === 'lookup-modal') {
        document.getElementById('lookup-modal').classList.add('hidden');
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && !e.target.matches('input, textarea')) {
        e.preventDefault();
        searchInput.focus();
      }
      if (e.key === 'Escape') {
        document.getElementById('lookup-modal').classList.add('hidden');
        SHKGraph.deselectAll();
      }
    });
  },

  cy() { return SHKGraph.cy; },

  applyFilters() {
    const filters = {
      showMuscles: document.getElementById('show-muscles').checked,
      showBones: document.getElementById('show-bones').checked,
      showSoftTissue: document.getElementById('show-soft-tissue').checked,
      showNerves: document.getElementById('show-nerves').checked,
      showJoints: document.getElementById('show-joints').checked,
      showSkin: document.getElementById('show-skin').checked,
      showLigaments: document.getElementById('show-ligaments').checked,
      showOrigin: document.getElementById('show-origin').checked,
      showInsertion: document.getElementById('show-insertion').checked,
      showInnervation: document.getElementById('show-innervation').checked,
      showArticulation: document.getElementById('show-articulation').checked,
      showLigamentAttach: document.getElementById('show-ligament-attach').checked,
      showSensoryInnervation: document.getElementById('show-sensory-innervation').checked,
      region: document.getElementById('region-filter').value,
    };
    SHKGraph.applyFilters(filters);
    this.updateStats();
  },

  updateStats() {
    const s = SHKGraph.getStats();
    document.getElementById('stats').textContent =
      `筋${s.muscles} 骨${s.bones} 組織${s.soft_tissue} 神経${s.nerves} 関節${s.joints} 靱帯${s.ligaments} 皮膚${s.skin} 関係${s.edges}`;
  },

  // Detail panel
  showDetail(nodeData) {
    const panel = document.getElementById('detail-panel');
    const content = document.getElementById('detail-content');

    // Look up data from maps (more reliable than fullData stored in cytoscape)
    let data;
    switch (nodeData.type) {
      case 'muscle': data = this.muscleMap.get(nodeData.id); break;
      case 'bone': data = this.boneMap.get(nodeData.id); break;
      case 'soft_tissue': data = this.boneMap.get(nodeData.id); break;
      case 'nerve': data = this.nerveMap.get(nodeData.id); break;
      case 'joint': data = this.jointMap.get(nodeData.id); break;
      case 'skin': data = this.skinMap.get(nodeData.id); break;
      case 'ligament': data = this.ligamentMap.get(nodeData.id); break;
    }

    if (!data) {
      console.warn('SHK: No data found for', nodeData.id, nodeData.type);
      return;
    }

    let html = '';

    try {
      switch (nodeData.type) {
        case 'muscle':
          html = this.renderMuscleDetail(data);
          break;
        case 'bone':
        case 'soft_tissue':
          html = this.renderBoneDetail(data);
          break;
        case 'nerve':
          html = this.renderNerveDetail(data);
          break;
        case 'joint':
          html = this.renderJointDetail(data);
          break;
        case 'skin':
          html = this.renderSkinDetail(data);
          break;
        case 'ligament':
          html = this.renderLigamentDetail(data);
          break;
      }
    } catch (err) {
      console.error('SHK renderDetail error:', err);
      html = `<p style="color:#e74c3c">描画エラー: ${err.message}</p>`;
    }

    content.innerHTML = html;
    panel.classList.remove('hidden');

    // Add click handlers for links
    content.querySelectorAll('.detail-link').forEach(el => {
      el.addEventListener('click', () => SHKGraph.focusNode(el.dataset.id));
    });
    content.querySelectorAll('.detail-tag').forEach(el => {
      if (el.dataset.id) {
        el.addEventListener('click', () => SHKGraph.focusNode(el.dataset.id));
      }
    });
  },

  hideDetail() {
    document.getElementById('detail-panel').classList.add('hidden');
  },

  renderMuscleDetail(m) {
    const typeColor = this.getTypeColor('muscle');
    const typeBg = this.getTypeBg('muscle');

    const originsHtml = m.origins.map(o => {
      const bone = this.boneMap.get(o.bone);
      const boneName = bone ? bone.name_ja : o.bone;
      return `<li><span class="detail-link" data-id="${o.bone}">${boneName}</span>${o.landmark ? ` (${o.landmark})` : ''}</li>`;
    }).join('');

    const insertionsHtml = m.insertions.map(ins => {
      const bone = this.boneMap.get(ins.bone);
      const boneName = bone ? bone.name_ja : ins.bone;
      return `<li><span class="detail-link" data-id="${ins.bone}">${boneName}</span>${ins.landmark ? ` (${ins.landmark})` : ''}</li>`;
    }).join('');

    const actionsHtml = (m.actions || []).map(a => {
      const joint = this.jointMap.get(a.joint);
      const jointName = joint ? joint.name_ja : a.joint;
      const motionJa = this.motionToJa(a.motion);
      const roleLabel = a.role === 'prime' ? '主動筋' : '補助筋';
      return `<div class="action-item">
        <span class="action-joint detail-link" data-id="${a.joint}">${jointName}</span>
        <span class="action-motion">${motionJa}</span>
        <span class="action-role">(${roleLabel})</span>
      </div>`;
    }).join('');

    const nervesHtml = m.innervation.map(inn => {
      const nerve = this.nerveMap.get(inn.nerve);
      const nerveName = nerve ? nerve.name_ja : inn.nerve;
      const levels = (inn.levels || []).map(l => `<span class="detail-tag spinal">${l}</span>`).join('');
      return `<li><span class="detail-link" data-id="${inn.nerve}">${nerveName}</span> ${levels}</li>`;
    }).join('');

    return `
      <div class="detail-header">
        <span class="detail-type" style="background:${typeBg};color:${typeColor}">筋</span>
        <div class="detail-name-ja">${m.name_ja}</div>
        <div class="detail-name-en">${m.name_en}</div>
        ${m.name_latin ? `<div class="detail-name-latin">${m.name_latin}</div>` : ''}
      </div>
      ${m.trivia ? `<div class="detail-section detail-trivia"><h4>豆知識</h4><p>${m.trivia}</p></div>` : ''}
      ${m.description ? `<div class="detail-section"><h4>解説</h4><p>${m.description}</p></div>` : ''}
      <div class="detail-section">
        <h4>起始</h4>
        <ul>${originsHtml || '<li>-</li>'}</ul>
      </div>
      <div class="detail-section">
        <h4>停止</h4>
        <ul>${insertionsHtml || '<li>-</li>'}</ul>
      </div>
      <div class="detail-section">
        <h4>作用</h4>
        ${actionsHtml || '<p>-</p>'}
      </div>
      <div class="detail-section">
        <h4>神経支配</h4>
        <ul>${nervesHtml || '<li>-</li>'}</ul>
      </div>
    `;
  },

  renderBoneDetail(b) {
    const nodeType = b.structure_type === 'soft_tissue' ? 'soft_tissue' : 'bone';
    const typeColor = this.getTypeColor(nodeType);
    const typeBg = this.getTypeBg(nodeType);

    // Find attached muscles
    const attachedMuscles = this.data.muscles.filter(m =>
      m.origins.some(o => o.bone === b.id) || m.insertions.some(i => i.bone === b.id)
    );

    const originating = attachedMuscles.filter(m => m.origins.some(o => o.bone === b.id));
    const inserting = attachedMuscles.filter(m => m.insertions.some(i => i.bone === b.id));

    // Find joints
    const relatedJoints = this.data.joints.filter(j => j.bones.includes(b.id));

    // Find ligaments
    const relatedLigaments = this.data.ligaments.filter(lg => lg.bones.includes(b.id));

    const landmarksHtml = (b.landmarks || []).map(l => `<span class="detail-tag">${l}</span>`).join(' ');

    return `
      <div class="detail-header">
        <span class="detail-type" style="background:${typeBg};color:${typeColor}">${nodeType === 'soft_tissue' ? '組織' : '骨'}</span>
        <div class="detail-name-ja">${b.name_ja}</div>
        <div class="detail-name-en">${b.name_en || ''}</div>
      </div>
      ${b.trivia ? `<div class="detail-section detail-trivia"><h4>豆知識</h4><p>${b.trivia}</p></div>` : ''}
      ${b.description ? `<div class="detail-section"><h4>解説</h4><p>${b.description}</p></div>` : ''}
      ${landmarksHtml ? `<div class="detail-section"><h4>ランドマーク</h4><p>${landmarksHtml}</p></div>` : ''}
      <div class="detail-section">
        <h4>関節</h4>
        <ul>${relatedJoints.map(j => `<li><span class="detail-link" data-id="${j.id}">${j.name_ja}</span></li>`).join('') || '<li>-</li>'}</ul>
      </div>
      ${relatedLigaments.length ? `<div class="detail-section">
        <h4>靱帯 (${relatedLigaments.length})</h4>
        <ul>${relatedLigaments.map(lg => `<li><span class="detail-link" data-id="${lg.id}">${lg.name_ja}</span></li>`).join('')}</ul>
      </div>` : ''}
      <div class="detail-section">
        <h4>起始する筋 (${originating.length})</h4>
        <ul>${originating.map(m => `<li><span class="detail-link" data-id="${m.id}">${m.name_ja}</span></li>`).join('') || '<li>-</li>'}</ul>
      </div>
      <div class="detail-section">
        <h4>停止する筋 (${inserting.length})</h4>
        <ul>${inserting.map(m => `<li><span class="detail-link" data-id="${m.id}">${m.name_ja}</span></li>`).join('') || '<li>-</li>'}</ul>
      </div>
    `;
  },

  renderNerveDetail(n) {
    const typeColor = this.getTypeColor('nerve');
    const typeBg = this.getTypeBg('nerve');

    // Find innervated muscles
    const innervated = this.data.muscles.filter(m =>
      m.innervation.some(inn => inn.nerve === n.id)
    );

    // Find sensory territories
    const sensoryTerritories = this.data.skin.filter(s => s.nerves.includes(n.id));

    // Find child nerves
    const children = this.data.nerves.filter(cn => cn.parent === n.id);

    // Find parent
    const parent = n.parent ? this.nerveMap.get(n.parent) : null;

    const levelsHtml = (n.root_levels || []).map(l => `<span class="detail-tag spinal">${l}</span>`).join(' ');

    return `
      <div class="detail-header">
        <span class="detail-type" style="background:${typeBg};color:${typeColor}">神経</span>
        <div class="detail-name-ja">${n.name_ja}</div>
        <div class="detail-name-en">${n.name_en || ''}</div>
      </div>
      ${n.trivia ? `<div class="detail-section detail-trivia"><h4>豆知識</h4><p>${n.trivia}</p></div>` : ''}
      ${n.description ? `<div class="detail-section"><h4>解説</h4><p>${n.description}</p></div>` : ''}
      ${levelsHtml ? `<div class="detail-section"><h4>神経根</h4><p>${levelsHtml}</p></div>` : ''}
      ${parent ? `<div class="detail-section"><h4>親神経</h4><p><span class="detail-link" data-id="${parent.id}">${parent.name_ja}</span></p></div>` : ''}
      ${children.length ? `<div class="detail-section"><h4>分枝</h4><ul>${children.map(c => `<li><span class="detail-link" data-id="${c.id}">${c.name_ja}</span></li>`).join('')}</ul></div>` : ''}
      <div class="detail-section">
        <h4>支配筋 (${innervated.length})</h4>
        <ul>${innervated.map(m => `<li><span class="detail-link" data-id="${m.id}">${m.name_ja}</span></li>`).join('') || '<li>-</li>'}</ul>
      </div>
      ${sensoryTerritories.length ? `<div class="detail-section">
        <h4>感覚支配域 (${sensoryTerritories.length})</h4>
        <ul>${sensoryTerritories.map(s => `<li><span class="detail-link" data-id="${s.id}">${s.name_ja}</span></li>`).join('')}</ul>
      </div>` : ''}
    `;
  },

  renderSkinDetail(s) {
    const typeColor = this.getTypeColor('skin');
    const typeBg = this.getTypeBg('skin');

    const nervesHtml = s.nerves.map(nId => {
      const nerve = this.nerveMap.get(nId);
      const nerveName = nerve ? nerve.name_ja : nId;
      return `<li><span class="detail-link" data-id="${nId}">${nerveName}</span></li>`;
    }).join('');

    return `
      <div class="detail-header">
        <span class="detail-type" style="background:${typeBg};color:${typeColor}">皮膚</span>
        <div class="detail-name-ja">${s.name_ja}</div>
        <div class="detail-name-en">${s.name_en || ''}</div>
      </div>
      ${s.trivia ? `<div class="detail-section detail-trivia"><h4>豆知識</h4><p>${s.trivia}</p></div>` : ''}
      ${s.description ? `<div class="detail-section"><h4>解説</h4><p>${s.description}</p></div>` : ''}
      <div class="detail-section">
        <h4>支配領域</h4>
        <p>${s.area}</p>
      </div>
      <div class="detail-section">
        <h4>支配神経</h4>
        <ul>${nervesHtml || '<li>-</li>'}</ul>
      </div>
    `;
  },

  renderLigamentDetail(lg) {
    const typeColor = this.getTypeColor('ligament');
    const typeBg = this.getTypeBg('ligament');

    const bonesHtml = lg.bones.map(bId => {
      const bone = this.boneMap.get(bId);
      return bone ? `<li><span class="detail-link" data-id="${bId}">${bone.name_ja}</span></li>` : `<li>${bId}</li>`;
    }).join('');

    const jointsHtml = lg.joints.map(jId => {
      const joint = this.jointMap.get(jId);
      return joint ? `<li><span class="detail-link" data-id="${jId}">${joint.name_ja}</span></li>` : `<li>${jId}</li>`;
    }).join('');

    return `
      <div class="detail-header">
        <span class="detail-type" style="background:${typeBg};color:${typeColor}">靱帯</span>
        <div class="detail-name-ja">${lg.name_ja}</div>
        <div class="detail-name-en">${lg.name_en || ''}</div>
      </div>
      ${lg.trivia ? `<div class="detail-section detail-trivia"><h4>豆知識</h4><p>${lg.trivia}</p></div>` : ''}
      ${lg.description ? `<div class="detail-section"><h4>解説</h4><p>${lg.description}</p></div>` : ''}
      <div class="detail-section">
        <h4>付着骨</h4>
        <ul>${bonesHtml || '<li>-</li>'}</ul>
      </div>
      <div class="detail-section">
        <h4>関連関節</h4>
        <ul>${jointsHtml || '<li>-</li>'}</ul>
      </div>
    `;
  },

  renderJointDetail(j) {
    const typeColor = this.getTypeColor('joint');
    const typeBg = this.getTypeBg('joint');

    const bonesHtml = j.bones.map(bId => {
      const bone = this.boneMap.get(bId);
      return bone ? `<li><span class="detail-link" data-id="${bId}">${bone.name_ja}</span></li>` : `<li>${bId}</li>`;
    }).join('');

    // Find related ligaments
    const relatedLigaments = this.data.ligaments.filter(lg => lg.joints.includes(j.id));

    // Find muscles acting on this joint
    const actingMuscles = this.data.muscles.filter(m =>
      (m.actions || []).some(a => a.joint === j.id)
    );

    // Group by motion
    const motionGroups = {};
    actingMuscles.forEach(m => {
      (m.actions || []).forEach(a => {
        if (a.joint === j.id) {
          if (!motionGroups[a.motion]) motionGroups[a.motion] = [];
          motionGroups[a.motion].push({ muscle: m, role: a.role });
        }
      });
    });

    const motionsHtml = Object.entries(motionGroups).map(([motion, items]) => {
      const musclesList = items.map(({ muscle, role }) => {
        const roleLabel = role === 'prime' ? '●' : '○';
        return `<span class="detail-link" data-id="${muscle.id}">${roleLabel} ${muscle.name_ja}</span>`;
      }).join('<br>');
      return `<div class="action-item">
        <div class="action-motion" style="font-weight:600;margin-bottom:2px">${this.motionToJa(motion)}</div>
        <div style="padding-left:8px;font-size:12px">${musclesList}</div>
      </div>`;
    }).join('');

    const typeJa = this.jointTypeToJa(j.type);

    return `
      <div class="detail-header">
        <span class="detail-type" style="background:${typeBg};color:${typeColor}">関節</span>
        <div class="detail-name-ja">${j.name_ja}</div>
        <div class="detail-name-en">${j.name_en || ''}</div>
      </div>
      ${j.trivia ? `<div class="detail-section detail-trivia"><h4>豆知識</h4><p>${j.trivia}</p></div>` : ''}
      ${j.description ? `<div class="detail-section"><h4>解説</h4><p>${j.description}</p></div>` : ''}
      <div class="detail-section">
        <h4>関節の種類</h4>
        <p>${typeJa}</p>
      </div>
      <div class="detail-section">
        <h4>構成骨</h4>
        <ul>${bonesHtml}</ul>
      </div>
      ${relatedLigaments.length ? `<div class="detail-section">
        <h4>靱帯 (${relatedLigaments.length})</h4>
        <ul>${relatedLigaments.map(lg => `<li><span class="detail-link" data-id="${lg.id}">${lg.name_ja}</span></li>`).join('')}</ul>
      </div>` : ''}
      <div class="detail-section">
        <h4>運動と筋 (● 主動筋 / ○ 補助筋)</h4>
        ${motionsHtml || '<p>-</p>'}
      </div>
    `;
  },

  // Reverse lookup modals
  openLookup(type) {
    const modal = document.getElementById('lookup-modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');

    switch (type) {
      case 'spinal':
        title.textContent = '脊髄レベル → 支配筋';
        body.innerHTML = this.renderSpinalLookup();
        break;
      case 'motion':
        title.textContent = '運動 → 関与筋';
        body.innerHTML = this.renderMotionLookup();
        break;
      case 'nerve':
        title.textContent = '神経 → 支配筋';
        body.innerHTML = this.renderNerveLookup();
        break;
    }

    modal.classList.remove('hidden');

    body.querySelectorAll('.detail-link').forEach(el => {
      el.addEventListener('click', () => {
        modal.classList.add('hidden');
        SHKGraph.focusNode(el.dataset.id);
      });
    });
  },

  renderSpinalLookup() {
    const levels = ['C1','C2','C3','C4','C5','C6','C7','C8','T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12','L1','L2','L3','L4','L5','S1','S2','S3','S4','S5'];
    const groups = {};
    levels.forEach(l => { groups[l] = []; });

    this.data.muscles.forEach(m => {
      m.innervation.forEach(inn => {
        (inn.levels || []).forEach(l => {
          if (groups[l]) groups[l].push(m);
        });
      });
    });

    return levels.map(l => {
      if (groups[l].length === 0) return '';
      return `<div class="modal-group">
        <h4>${l} (${groups[l].length}筋)</h4>
        <ul>${groups[l].map(m => `<li><span class="detail-link" data-id="${m.id}">${m.name_ja}</span></li>`).join('')}</ul>
      </div>`;
    }).join('');
  },

  renderMotionLookup() {
    const motionMuscles = {};
    this.data.muscles.forEach(m => {
      (m.actions || []).forEach(a => {
        const joint = this.jointMap.get(a.joint);
        const key = `${joint ? joint.name_ja : a.joint} - ${this.motionToJa(a.motion)}`;
        if (!motionMuscles[key]) motionMuscles[key] = [];
        motionMuscles[key].push({ muscle: m, role: a.role });
      });
    });

    return Object.entries(motionMuscles).sort().map(([key, items]) => {
      const primes = items.filter(i => i.role === 'prime');
      const assists = items.filter(i => i.role === 'assist');
      return `<div class="modal-group">
        <h4>${key}</h4>
        <ul>
          ${primes.map(i => `<li>● <span class="detail-link" data-id="${i.muscle.id}">${i.muscle.name_ja}</span></li>`).join('')}
          ${assists.map(i => `<li>○ <span class="detail-link" data-id="${i.muscle.id}">${i.muscle.name_ja}</span></li>`).join('')}
        </ul>
      </div>`;
    }).join('');
  },

  renderNerveLookup() {
    const nerveGroups = {};
    this.data.nerves.forEach(n => {
      const innervated = this.data.muscles.filter(m =>
        m.innervation.some(inn => inn.nerve === n.id)
      );
      if (innervated.length > 0) {
        nerveGroups[n.name_ja] = { nerve: n, muscles: innervated };
      }
    });

    return Object.entries(nerveGroups).sort().map(([name, { nerve, muscles }]) => {
      return `<div class="modal-group">
        <h4><span class="detail-link" data-id="${nerve.id}">${name}</span> (${muscles.length}筋)</h4>
        <ul>${muscles.map(m => `<li><span class="detail-link" data-id="${m.id}">${m.name_ja}</span></li>`).join('')}</ul>
      </div>`;
    }).join('');
  },

  // Helpers
  motionToJa(motion) {
    const map = {
      flexion: '屈曲', extension: '伸展',
      abduction: '外転', adduction: '内転',
      internal_rotation: '内旋', external_rotation: '外旋',
      pronation: '回内', supination: '回外',
      elevation: '挙上', depression: '下制',
      protraction: '前突', retraction: '後退',
      lateral_flexion: '側屈', rotation: '回旋',
      dorsiflexion: '背屈', plantarflexion: '底屈',
      inversion: '内反', eversion: '外反',
      horizontal_adduction: '水平内転', horizontal_abduction: '水平外転',
      upward_rotation: '上方回旋', downward_rotation: '下方回旋',
      opposition: '対立', reposition: '復位',
      radial_deviation: '橈屈', ulnar_deviation: '尺屈',
      circumduction: '分回し',
      lateral_rotation: '外旋', medial_rotation: '内旋',
      anterior_tilt: '前傾', posterior_tilt: '後傾',
    };
    return map[motion] || motion;
  },

  jointTypeToJa(type) {
    const map = {
      ball_and_socket: '球関節',
      hinge: '蝶番関節',
      pivot: '車軸関節',
      condyloid: '顆状関節',
      saddle: '鞍関節',
      plane: '平面関節',
      ellipsoid: '楕円関節',
      bicondylar: '二顆関節',
      symphysis: '結合',
      synarthrosis: '不動関節',
      gomphosis: '釘植関節',
      suture: '縫合',
      synchondrosis: '軟骨結合',
      syndesmosis: '靱帯結合',
    };
    return map[type] || type;
  },

  getTypeColor(type) {
    return { muscle: '#c47878', bone: '#8a9aa6', soft_tissue: '#b0967e', nerve: '#b89a30', joint: '#5da578', ligament: '#5a9aab', skin: '#9b7cb5' }[type] || '#777';
  },

  getTypeBg(type) {
    return {
      muscle: 'rgba(196,120,120,0.15)',
      bone: 'rgba(138,154,166,0.15)',
      soft_tissue: 'rgba(176,150,126,0.15)',
      nerve: 'rgba(184,154,48,0.15)',
      joint: 'rgba(93,165,120,0.15)',
      ligament: 'rgba(90,154,171,0.15)',
      skin: 'rgba(155,124,181,0.15)',
    }[type] || 'rgba(120,120,120,0.12)';
  },

  getTypeLabel(type) {
    return { muscle: '筋', bone: '骨', soft_tissue: '組織', nerve: '神経', joint: '関節', ligament: '靱帯', skin: '皮膚' }[type] || type;
  },
};

// Mobile sidebar drawer
function initSidebarDrawer() {
  const toggle = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (!toggle || !sidebar || !overlay) return;

  function openDrawer() {
    sidebar.classList.add('open');
    overlay.classList.remove('hidden');
    toggle.classList.add('active');
  }
  function closeDrawer() {
    sidebar.classList.remove('open');
    overlay.classList.add('hidden');
    toggle.classList.remove('active');
  }

  toggle.addEventListener('click', () => {
    sidebar.classList.contains('open') ? closeDrawer() : openDrawer();
  });
  overlay.addEventListener('click', closeDrawer);
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  SHKApp.init();
  initSidebarDrawer();
});
