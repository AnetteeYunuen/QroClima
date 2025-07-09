const mongoose = require('mongoose');

const reportSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    username: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    riskType: {
      type: String,
      required: true,
      enum: ['inundacion_leve', 'inundacion_severa', 'lluvia_intensa', 'accidente', 'Otro'],
    },
    description: {
      type: String,
      required: false,
    },
    active: {
      type: Boolean,
      default: true,
    },
    // Podríamos agregar coordenadas GPS en una implementación futura
    // coordinates: {
    //   lat: Number,
    //   lng: Number
    // }
  },
  {
    timestamps: true,
  }
);

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;