// data.js - Data utilities for SHK

const SHKData = {
  // Motion type definitions
  motionTypes: {
    flexion: { ja: '屈曲', en: 'Flexion' },
    extension: { ja: '伸展', en: 'Extension' },
    abduction: { ja: '外転', en: 'Abduction' },
    adduction: { ja: '内転', en: 'Adduction' },
    internal_rotation: { ja: '内旋', en: 'Internal rotation' },
    external_rotation: { ja: '外旋', en: 'External rotation' },
    pronation: { ja: '回内', en: 'Pronation' },
    supination: { ja: '回外', en: 'Supination' },
    elevation: { ja: '挙上', en: 'Elevation' },
    depression: { ja: '下制', en: 'Depression' },
    protraction: { ja: '前突', en: 'Protraction' },
    retraction: { ja: '後退', en: 'Retraction' },
    lateral_flexion: { ja: '側屈', en: 'Lateral flexion' },
    rotation: { ja: '回旋', en: 'Rotation' },
    dorsiflexion: { ja: '背屈', en: 'Dorsiflexion' },
    plantarflexion: { ja: '底屈', en: 'Plantarflexion' },
    inversion: { ja: '内反', en: 'Inversion' },
    eversion: { ja: '外反', en: 'Eversion' },
    horizontal_adduction: { ja: '水平内転', en: 'Horizontal adduction' },
    horizontal_abduction: { ja: '水平外転', en: 'Horizontal abduction' },
    upward_rotation: { ja: '上方回旋', en: 'Upward rotation' },
    downward_rotation: { ja: '下方回旋', en: 'Downward rotation' },
    opposition: { ja: '対立', en: 'Opposition' },
    reposition: { ja: '復位', en: 'Reposition' },
    radial_deviation: { ja: '橈屈', en: 'Radial deviation' },
    ulnar_deviation: { ja: '尺屈', en: 'Ulnar deviation' },
    circumduction: { ja: '分回し', en: 'Circumduction' },
    anterior_tilt: { ja: '前傾', en: 'Anterior tilt' },
    posterior_tilt: { ja: '後傾', en: 'Posterior tilt' },
  },

  // Region definitions
  regions: {
    head_neck: { ja: '頭頸部', en: 'Head & Neck' },
    upper_limb: { ja: '上肢', en: 'Upper Limb' },
    lower_limb: { ja: '下肢', en: 'Lower Limb' },
    trunk: { ja: '体幹', en: 'Trunk' },
    back: { ja: '背部', en: 'Back' },
    pelvis: { ja: '骨盤・会陰', en: 'Pelvis & Perineum' },
  },

  // Joint type definitions
  jointTypes: {
    ball_and_socket: { ja: '球関節', en: 'Ball and socket' },
    hinge: { ja: '蝶番関節', en: 'Hinge' },
    pivot: { ja: '車軸関節', en: 'Pivot' },
    condyloid: { ja: '顆状関節', en: 'Condyloid' },
    saddle: { ja: '鞍関節', en: 'Saddle' },
    plane: { ja: '平面関節', en: 'Plane/Gliding' },
    ellipsoid: { ja: '楕円関節', en: 'Ellipsoid' },
    bicondylar: { ja: '二顆関節', en: 'Bicondylar' },
  },

  // Validate data integrity
  validate(muscles, bones, nerves, joints, skin, ligaments) {
    const errors = [];
    const boneIds = new Set(bones.map(b => b.id));
    const nerveIds = new Set(nerves.map(n => n.id));
    const jointIds = new Set(joints.map(j => j.id));

    muscles.forEach(m => {
      m.origins.forEach(o => {
        if (o.bone && !boneIds.has(o.bone)) {
          errors.push(`Muscle ${m.id}: origin bone ${o.bone} not found`);
        }
      });
      m.insertions.forEach(i => {
        if (i.bone && !boneIds.has(i.bone)) {
          errors.push(`Muscle ${m.id}: insertion bone ${i.bone} not found`);
        }
      });
      m.innervation.forEach(inn => {
        if (inn.nerve && !nerveIds.has(inn.nerve)) {
          errors.push(`Muscle ${m.id}: nerve ${inn.nerve} not found`);
        }
      });
      (m.actions || []).forEach(a => {
        if (a.joint && !jointIds.has(a.joint)) {
          errors.push(`Muscle ${m.id}: joint ${a.joint} not found`);
        }
      });
    });

    joints.forEach(j => {
      j.bones.forEach(bId => {
        if (!boneIds.has(bId)) {
          errors.push(`Joint ${j.id}: bone ${bId} not found`);
        }
      });
    });

    (skin || []).forEach(s => {
      s.nerves.forEach(nId => {
        if (!nerveIds.has(nId)) {
          errors.push(`Skin ${s.id}: nerve ${nId} not found`);
        }
      });
    });

    (ligaments || []).forEach(lg => {
      lg.bones.forEach(bId => {
        if (!boneIds.has(bId)) {
          errors.push(`Ligament ${lg.id}: bone ${bId} not found`);
        }
      });
      lg.joints.forEach(jId => {
        if (!jointIds.has(jId)) {
          errors.push(`Ligament ${lg.id}: joint ${jId} not found`);
        }
      });
    });

    if (errors.length > 0) {
      console.warn(`Data validation: ${errors.length} issues found`);
      errors.slice(0, 20).forEach(e => console.warn('  ' + e));
      if (errors.length > 20) console.warn(`  ... and ${errors.length - 20} more`);
    }

    return errors;
  },
};
