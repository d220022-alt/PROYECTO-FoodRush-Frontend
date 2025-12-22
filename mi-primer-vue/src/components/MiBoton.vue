<script setup>
import { ref } from "vue";

const nombreTarea = ref("");
const completada = ref(false);

const guardarTarea = () => {
  const tarea = {
    nombre: nombreTarea.value,
    completada: completada.value,
  };

  console.log("Tarea guardada:", tarea);
  // Un alert más amigable o simplemente el console
  alert(`Tarea "${tarea.nombre}" registrada correctamente.`);
};
</script>

<template>
  <div class="form-container">
    <div class="box">
      <div class="header-strip"></div>
      <h2><i class="fas fa-tasks"></i> Registrar Tarea</h2>

      <div class="form-group">
        <label>Nombre de la tarea</label>
        <input
          type="text"
          v-model="nombreTarea"
          placeholder="Ej: Revisar inventario de salsas"
        />
      </div>

      <div class="form-group">
        <label>Estado</label>
        <select v-model="completada">
          <option :value="false">Pendiente</option>
          <option :value="true">Completada</option>
        </select>
      </div>

      <button @click="guardarTarea">
        Guardar Tarea
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Importamos fuente si no está en el global */
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');

.form-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background-color: #fdfbf7; /* Fondo crema FoodRush */
  min-height: 100vh; /* Para visualizarlo bien si está solo */
}

.box {
  background-color: white;
  width: 100%;
  max-width: 400px;
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  position: relative;
  overflow: hidden;
  border: 1px solid #eee;
}

/* Tira decorativa superior (Amarilla como el header) */
.header-strip {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 8px;
  background-color: #facc15;
}

h2 {
  color: #c21a1a; /* Rojo FoodRush */
  margin-bottom: 25px;
  text-align: center;
  font-family: 'Segoe UI', sans-serif;
  font-size: 24px;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #333;
  font-size: 14px;
}

input, select {
  width: 100%;
  padding: 12px;
  border: 2px solid #eee;
  border-radius: 8px;
  font-size: 14px;
  transition: 0.3s;
  outline: none;
  background-color: #f9f9f9;
}

input:focus, select:focus {
  border-color: #facc15; /* Borde amarillo al enfocar */
  background-color: white;
}

button {
  width: 100%;
  padding: 12px;
  background-color: #c21a1a; /* Rojo botón */
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: 0.3s;
  margin-top: 10px;
}

button:hover {
  background-color: #a01515; /* Rojo más oscuro al pasar mouse */
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(194, 26, 26, 0.3);
}
</style>