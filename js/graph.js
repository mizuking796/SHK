// graph.js - Cytoscape.js graph management for SHK

const SHKGraph = {
  cy: null,
  selectedNode: null,

  // Color scheme
  colors: {
    muscle: '#c47878',
    bone: '#8a9aa6',
    nerve: '#b89a30',
    joint: '#5da578',
    skin: '#9b7cb5',
    ligament: '#5a9aab',
    origin: '#b88040',
    insertion: '#5a8ab5',
    innervation: '#b89a30',
    articulation: '#5da578',
    sensory_innervation: '#9b7cb5',
    ligament_attach: '#5a9aab',
  },

  init(container) {
    this.cy = cytoscape({
      container,
      style: this.getStyle(),
      layout: { name: 'preset' },
      minZoom: 0.1,
      maxZoom: 5,
      wheelSensitivity: 0.3,
    });

    this.cy.on('tap', 'node', (e) => {
      this.selectNode(e.target);
    });

    this.cy.on('tap', (e) => {
      if (e.target === this.cy) {
        this.deselectAll();
      }
    });

    return this;
  },

  getStyle() {
    return [
      // Node base style
      {
        selector: 'node',
        style: {
          'label': 'data(label)',
          'font-size': 13,
          'color': '#4a4540',
          'text-valign': 'bottom',
          'text-margin-y': 5,
          'text-outline-color': '#faf6f0',
          'text-outline-width': 2.5,
          'text-max-width': '100px',
          'text-wrap': 'ellipsis',
          'min-zoomed-font-size': 8,
        },
      },
      // Muscle nodes
      {
        selector: 'node[type="muscle"]',
        style: {
          'background-color': this.colors.muscle,
          'shape': 'ellipse',
          'width': 'mapData(degree, 1, 20, 16, 40)',
          'height': 'mapData(degree, 1, 20, 16, 40)',
          'border-width': 0,
          'border-color': 'transparent',
        },
      },
      // Bone nodes
      {
        selector: 'node[type="bone"]',
        style: {
          'background-color': this.colors.bone,
          'shape': 'round-rectangle',
          'width': 'mapData(degree, 1, 30, 18, 50)',
          'height': 'mapData(degree, 1, 30, 14, 36)',
          'color': '#4a4540',
          'border-width': 0,
          'border-color': 'transparent',
        },
      },
      // Nerve nodes
      {
        selector: 'node[type="nerve"]',
        style: {
          'background-color': this.colors.nerve,
          'shape': 'diamond',
          'width': 'mapData(degree, 1, 30, 14, 36)',
          'height': 'mapData(degree, 1, 30, 14, 36)',
          'border-width': 0,
          'border-color': 'transparent',
        },
      },
      // Joint nodes
      {
        selector: 'node[type="joint"]',
        style: {
          'background-color': this.colors.joint,
          'shape': 'hexagon',
          'width': 'mapData(degree, 1, 20, 16, 40)',
          'height': 'mapData(degree, 1, 20, 16, 40)',
          'border-width': 0,
          'border-color': 'transparent',
        },
      },
      // Ligament nodes
      {
        selector: 'node[type="ligament"]',
        style: {
          'background-color': this.colors.ligament,
          'shape': 'round-triangle',
          'width': 'mapData(degree, 1, 10, 14, 34)',
          'height': 'mapData(degree, 1, 10, 14, 34)',
          'border-width': 0,
          'border-color': 'transparent',
        },
      },
      // Skin nodes
      {
        selector: 'node[type="skin"]',
        style: {
          'background-color': this.colors.skin,
          'shape': 'round-pentagon',
          'width': 'mapData(degree, 1, 10, 14, 32)',
          'height': 'mapData(degree, 1, 10, 14, 32)',
          'border-width': 0,
          'border-color': 'transparent',
        },
      },
      // Edge styles
      {
        selector: 'edge',
        style: {
          'width': 1,
          'opacity': 0.4,
          'curve-style': 'bezier',
          'line-color': '#d5cdc2',
        },
      },
      {
        selector: 'edge[type="origin"]',
        style: { 'line-color': this.colors.origin, 'target-arrow-color': this.colors.origin, 'target-arrow-shape': 'triangle', 'arrow-scale': 0.6 },
      },
      {
        selector: 'edge[type="insertion"]',
        style: { 'line-color': this.colors.insertion, 'target-arrow-color': this.colors.insertion, 'target-arrow-shape': 'triangle', 'arrow-scale': 0.6 },
      },
      {
        selector: 'edge[type="innervation"]',
        style: { 'line-color': this.colors.innervation, 'line-style': 'dashed', 'line-dash-pattern': [4, 3] },
      },
      {
        selector: 'edge[type="articulation"]',
        style: { 'line-color': this.colors.articulation, 'width': 2 },
      },
      {
        selector: 'edge[type="ligament_attach"]',
        style: { 'line-color': this.colors.ligament_attach, 'width': 1.5, 'line-style': 'dotted' },
      },
      {
        selector: 'edge[type="sensory_innervation"]',
        style: { 'line-color': this.colors.sensory_innervation, 'line-style': 'dashed', 'line-dash-pattern': [6, 4], 'target-arrow-color': this.colors.sensory_innervation, 'target-arrow-shape': 'diamond', 'arrow-scale': 0.5 },
      },
      // Selected / highlighted
      {
        selector: 'node.highlighted',
        style: {
          'border-width': 3,
          'border-color': '#5a8ab5',
          'font-size': 15,
          'text-outline-width': 3,
          'z-index': 10,
        },
      },
      {
        selector: 'node.neighbor',
        style: {
          'opacity': 1,
          'border-width': 2,
          'border-color': '#5a8ab5',
          'z-index': 5,
        },
      },
      {
        selector: 'node.faded',
        style: {
          'opacity': 0.12,
        },
      },
      {
        selector: 'edge.highlighted',
        style: {
          'opacity': 0.9,
          'width': 2,
          'z-index': 10,
        },
      },
      {
        selector: 'edge.faded',
        style: {
          'opacity': 0.05,
        },
      },
      // Hidden
      {
        selector: '.hidden',
        style: { 'display': 'none' },
      },
    ];
  },

  // Load data into graph
  loadData(muscles, bones, nerves, joints, skin, ligaments) {
    const elements = [];

    // Add bone nodes
    bones.forEach(b => {
      elements.push({
        data: {
          id: b.id,
          label: b.name_ja,
          type: 'bone',
          region: b.region,
          fullData: b,
        },
      });
    });

    // Add nerve nodes
    nerves.forEach(n => {
      elements.push({
        data: {
          id: n.id,
          label: n.name_ja,
          type: 'nerve',
          region: n.region,
          fullData: n,
        },
      });
    });

    // Add joint nodes
    joints.forEach(j => {
      elements.push({
        data: {
          id: j.id,
          label: j.name_ja,
          type: 'joint',
          region: j.region,
          fullData: j,
        },
      });

      // Add articulation edges (joint-bone)
      j.bones.forEach(boneId => {
        elements.push({
          data: {
            id: `${j.id}_${boneId}`,
            source: j.id,
            target: boneId,
            type: 'articulation',
          },
        });
      });
    });

    // Add muscle nodes and edges
    muscles.forEach(m => {
      elements.push({
        data: {
          id: m.id,
          label: m.name_ja,
          type: 'muscle',
          region: m.region,
          fullData: m,
        },
      });

      // Origin edges
      m.origins.forEach((o, i) => {
        if (o.bone) {
          elements.push({
            data: {
              id: `${m.id}_origin_${i}`,
              source: m.id,
              target: o.bone,
              type: 'origin',
              label: o.landmark || '',
            },
          });
        }
      });

      // Insertion edges
      m.insertions.forEach((ins, i) => {
        if (ins.bone) {
          elements.push({
            data: {
              id: `${m.id}_insertion_${i}`,
              source: m.id,
              target: ins.bone,
              type: 'insertion',
              label: ins.landmark || '',
            },
          });
        }
      });

      // Innervation edges
      m.innervation.forEach((inn, i) => {
        if (inn.nerve) {
          elements.push({
            data: {
              id: `${m.id}_innerv_${i}`,
              source: inn.nerve,
              target: m.id,
              type: 'innervation',
            },
          });
        }
      });
    });

    // Add ligament nodes and attachment edges
    (ligaments || []).forEach(lg => {
      elements.push({
        data: {
          id: lg.id,
          label: lg.name_ja,
          type: 'ligament',
          region: lg.region,
          fullData: lg,
        },
      });

      lg.bones.forEach((boneId, i) => {
        elements.push({
          data: {
            id: `${lg.id}_attach_${i}`,
            source: lg.id,
            target: boneId,
            type: 'ligament_attach',
          },
        });
      });
    });

    // Add skin nodes and sensory_innervation edges
    (skin || []).forEach(s => {
      elements.push({
        data: {
          id: s.id,
          label: s.name_ja,
          type: 'skin',
          region: s.region,
          fullData: s,
        },
      });

      s.nerves.forEach((nerveId, i) => {
        elements.push({
          data: {
            id: `${s.id}_sensory_${i}`,
            source: nerveId,
            target: s.id,
            type: 'sensory_innervation',
          },
        });
      });
    });

    // Filter out edges referencing missing nodes
    const nodeIds = new Set(elements.filter(e => !e.data.source).map(e => e.data.id));
    const validElements = elements.filter(e => {
      if (e.data.source) {
        return nodeIds.has(e.data.source) && nodeIds.has(e.data.target);
      }
      return true;
    });

    this.cy.add(validElements);

    // Set degree data on nodes for mapData styling
    this.cy.nodes().forEach(n => {
      n.data('degree', n.degree());
    });

    this.runLayout('cluster');
  },

  // Run layout
  runLayout(name, options = {}) {
    if (name === 'cluster') {
      this.runClusterLayout();
      return;
    }

    const defaults = {
      grid: { name: 'grid', animate: true, animationDuration: 500, condense: true },
      concentric: {
        name: 'concentric',
        animate: true,
        animationDuration: 500,
        concentric: (node) => node.degree(),
        levelWidth: () => 1,
        minNodeSpacing: 3,
        avoidOverlap: true,
        equidistant: false,
        spacingFactor: 0.6,
      },
    };

    const layoutOpts = { ...(defaults[name] || { name }), ...options };
    const visibleNodes = this.cy.nodes(':visible');
    if (visibleNodes.length > 0) {
      visibleNodes.layout(layoutOpts).run();
    }
  },

  // Olympic-rings style cluster layout
  runClusterLayout() {
    const w = this.cy.width();
    const h = this.cy.height();
    const cx = w / 2;
    const cy = h / 2;

    // Region centers arranged in anatomical layout
    const regionCenters = {
      head_neck:  { x: cx,            y: cy - h * 0.34 },
      trunk:      { x: cx - w * 0.12, y: cy - h * 0.05 },
      back:       { x: cx + w * 0.12, y: cy - h * 0.05 },
      upper_limb: { x: cx - w * 0.32, y: cy - h * 0.08 },
      lower_limb: { x: cx,            y: cy + h * 0.28 },
      pelvis:     { x: cx + w * 0.32, y: cy + h * 0.08 },
    };

    // Cluster radius based on node count per region
    const regionNodes = {};
    const visible = this.cy.nodes(':visible');

    // Group nodes by region
    visible.forEach(n => {
      const r = n.data('region') || 'trunk';
      if (!regionNodes[r]) regionNodes[r] = { bone: [], joint: [], ligament: [], muscle: [], nerve: [], skin: [] };
      const type = n.data('type');
      if (regionNodes[r][type]) regionNodes[r][type].push(n);
    });

    // Position each region cluster
    Object.entries(regionNodes).forEach(([region, groups]) => {
      const center = regionCenters[region] || { x: cx, y: cy };
      const totalNodes = Object.values(groups).flat().length;
      const baseRadius = Math.max(40, Math.sqrt(totalNodes) * 18);

      // Layer 0: Bones at center (tight cluster)
      this.placeInCircle(groups.bone, center, baseRadius * 0.25, baseRadius * 0.55);

      // Layer 1: Joints slightly out
      this.placeInCircle(groups.joint, center, baseRadius * 0.55, baseRadius * 0.75);

      // Layer 1.5: Ligaments near joints
      this.placeInCircle(groups.ligament, center, baseRadius * 0.65, baseRadius * 0.85);

      // Layer 2: Muscles in outer ring
      this.placeInCircle(groups.muscle, center, baseRadius * 0.7, baseRadius * 1.0);

      // Layer 3: Nerves
      this.placeInCircle(groups.nerve, center, baseRadius * 0.95, baseRadius * 1.15);

      // Layer 4: Skin outermost
      this.placeInCircle(groups.skin, center, baseRadius * 1.1, baseRadius * 1.3);
    });

    // Animate to positions
    this.cy.nodes().animate({ duration: 600 });
    this.cy.fit(undefined, 30);
  },

  // Place nodes in a ring (or spiral if many)
  placeInCircle(nodes, center, innerR, outerR) {
    if (!nodes || nodes.length === 0) return;

    const count = nodes.length;

    if (count === 1) {
      nodes[0].position({ x: center.x, y: center.y - innerR * 0.5 });
      return;
    }

    // Sort by degree (most connected toward center)
    nodes.sort((a, b) => b.degree() - a.degree());

    // Multiple rings if too many for one circle
    const maxPerRing = Math.max(6, Math.floor((2 * Math.PI * outerR) / 22));
    const rings = Math.ceil(count / maxPerRing);

    let idx = 0;
    for (let ring = 0; ring < rings; ring++) {
      const r = innerR + (outerR - innerR) * (ring / Math.max(1, rings - 1));
      const nodesInRing = Math.min(maxPerRing, count - idx);
      const angleStep = (2 * Math.PI) / nodesInRing;
      const startAngle = ring * 0.3; // Offset each ring

      for (let i = 0; i < nodesInRing; i++) {
        const angle = startAngle + i * angleStep - Math.PI / 2;
        nodes[idx].position({
          x: center.x + r * Math.cos(angle),
          y: center.y + r * Math.sin(angle),
        });
        idx++;
      }
    }
  },

  // Select a node and highlight neighbors
  selectNode(node) {
    this.deselectAll();
    this.selectedNode = node;

    // Fade all
    this.cy.elements().addClass('faded');

    // Highlight selected node
    node.removeClass('faded').addClass('highlighted');

    // Highlight connected edges and neighbor nodes
    const connectedEdges = node.connectedEdges(':visible');
    connectedEdges.removeClass('faded').addClass('highlighted');

    const neighbors = connectedEdges.connectedNodes();
    neighbors.removeClass('faded').addClass('neighbor');

    // Trigger detail panel
    if (typeof SHKApp !== 'undefined') {
      SHKApp.showDetail(node.data());
    }
  },

  deselectAll() {
    this.selectedNode = null;
    this.cy.elements().removeClass('highlighted neighbor faded');
    if (typeof SHKApp !== 'undefined') {
      SHKApp.hideDetail();
    }
  },

  // Focus on a specific node
  focusNode(nodeId) {
    const node = this.cy.getElementById(nodeId);
    if (node.length > 0) {
      this.selectNode(node);
      this.cy.animate({
        center: { eles: node },
        zoom: 2,
      }, { duration: 500 });
    }
  },

  // Filter visibility
  applyFilters(filters) {
    // Reset
    this.cy.elements().removeClass('hidden');

    // Node type filters
    if (!filters.showMuscles) this.cy.nodes('[type="muscle"]').addClass('hidden');
    if (!filters.showBones) this.cy.nodes('[type="bone"]').addClass('hidden');
    if (!filters.showNerves) this.cy.nodes('[type="nerve"]').addClass('hidden');
    if (!filters.showJoints) this.cy.nodes('[type="joint"]').addClass('hidden');
    if (!filters.showSkin) this.cy.nodes('[type="skin"]').addClass('hidden');
    if (!filters.showLigaments) this.cy.nodes('[type="ligament"]').addClass('hidden');

    // Edge type filters
    if (!filters.showOrigin) this.cy.edges('[type="origin"]').addClass('hidden');
    if (!filters.showInsertion) this.cy.edges('[type="insertion"]').addClass('hidden');
    if (!filters.showInnervation) this.cy.edges('[type="innervation"]').addClass('hidden');
    if (!filters.showArticulation) this.cy.edges('[type="articulation"]').addClass('hidden');
    if (!filters.showLigamentAttach) this.cy.edges('[type="ligament_attach"]').addClass('hidden');
    if (!filters.showSensoryInnervation) this.cy.edges('[type="sensory_innervation"]').addClass('hidden');

    // Region filter
    if (filters.region) {
      this.cy.nodes().forEach(n => {
        if (n.data('region') !== filters.region) {
          n.addClass('hidden');
        }
      });
    }

    // Hide edges connected to hidden nodes
    this.cy.edges().forEach(e => {
      if (e.source().hasClass('hidden') || e.target().hasClass('hidden')) {
        e.addClass('hidden');
      }
    });

    // Hide orphan nodes (nodes with no visible edges)
    // Only hide if they wouldn't be visible anyway
  },

  // Get visible stats
  getStats() {
    const visible = this.cy.elements(':visible');
    return {
      muscles: visible.nodes('[type="muscle"]').length,
      bones: visible.nodes('[type="bone"]').length,
      nerves: visible.nodes('[type="nerve"]').length,
      joints: visible.nodes('[type="joint"]').length,
      skin: visible.nodes('[type="skin"]').length,
      ligaments: visible.nodes('[type="ligament"]').length,
      edges: visible.edges().length,
    };
  },
};
