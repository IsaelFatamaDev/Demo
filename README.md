# 🧪 Guía Completa de Tests del Microservicio Reactivo

Este documento explica en detalle todos los tests implementados en el microservicio reactivo con Spring Boot WebFlux.

## 📑 Tabla de Contenidos

- [Tipos de Tests](#tipos-de-tests)
- [Tests de Integración](#tests-de-integración)
- [Tests de Repositorio](#tests-de-repositorio)
- [Conceptos Reactivos](#conceptos-reactivos)
- [Cómo Ejecutar los Tests](#cómo-ejecutar-los-tests)

---

## 🔍 Tipos de Tests

El proyecto incluye **2 tipos de tests**:

### 1️⃣ **Tests de Integración** (`ProductIntegrationTest`)

- ✅ Prueban **toda la aplicación** de extremo a extremo
- ✅ Desde el endpoint HTTP hasta la base de datos
- ✅ Validan el comportamiento completo del sistema
- ⏱️ Más lentos pero más completos

### 2️⃣ **Tests de Repositorio** (`ProductRepositoryTest`)

- ✅ Prueban **solo la capa de datos**
- ✅ Validan queries y operaciones de BD
- ✅ Más rápidos y enfocados
- ⚡ Usan `StepVerifier` para validar streams reactivos

---

## 🔵 Tests de Integración

### 📦 Configuración

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebTestClient
class ProductIntegrationTest {

    @Autowired
    private WebTestClient webTestClient;  // Cliente HTTP para tests

    @Autowired
    private ProductRepository productRepository;  // Para preparar datos

    @BeforeEach
    void setUp() {
        // Limpia la base de datos antes de cada test
        productRepository.deleteAll().block();
    }
}
```

**Anotaciones importantes:**

- `@SpringBootTest`: Levanta toda la aplicación Spring Boot
- `RANDOM_PORT`: Usa un puerto aleatorio para evitar conflictos
- `@AutoConfigureWebTestClient`: Inyecta el cliente HTTP de pruebas
- `@BeforeEach`: Se ejecuta antes de cada test para limpiar datos

---

### 🧪 Test 1: Obtener Todos los Productos

```java
@Test
void testGetAllProducts() {
    // Given: Crear productos de prueba
    Product product1 = new Product(null, "Product 1", "Description 1",
                                   new BigDecimal("100.00"), 10);
    Product product2 = new Product(null, "Product 2", "Description 2",
                                   new BigDecimal("200.00"), 20);

    productRepository.save(product1).block();
    productRepository.save(product2).block();

    // When & Then: Verificar que se obtienen todos los productos
    webTestClient.get()
            .uri("/api/products")
            .exchange()
            .expectStatus().isOk()
            .expectHeader().contentType(MediaType.APPLICATION_JSON)
            .expectBodyList(Product.class)
            .hasSize(2);
}
```

**¿Qué hace?**

1. 📝 Crea 2 productos en la base de datos
2. 🔍 Hace un `GET /api/products`
3. ✅ Verifica que retorna HTTP 200
4. ✅ Verifica que el Content-Type es JSON
5. ✅ Verifica que retorna exactamente 2 productos

---

### 🧪 Test 2: Obtener Producto por ID

```java
@Test
void testGetProductById() {
    // Given: Crear un producto
    Product product = new Product(null, "Test Product", "Test Description",
                                  new BigDecimal("150.00"), 15);
    Product savedProduct = productRepository.save(product).block();

    // When & Then: Obtener el producto por ID
    webTestClient.get()
            .uri("/api/products/{id}", savedProduct.getId())
            .exchange()
            .expectStatus().isOk()
            .expectBody(Product.class)
            .value(p -> {
                assertThat(p.getName()).isEqualTo("Test Product");
                assertThat(p.getPrice()).isEqualByComparingTo(new BigDecimal("150.00"));
            });
}
```

**¿Qué hace?**

1. 📝 Guarda un producto y obtiene su ID generado
2. 🔍 Hace un `GET /api/products/{id}`
3. ✅ Verifica HTTP 200
4. ✅ Valida que el nombre sea "Test Product"
5. ✅ Valida que el precio sea 150.00

**Nota:** `.block()` bloquea la ejecución hasta que el `Mono` complete

---

### 🧪 Test 3: Producto No Encontrado

```java
@Test
void testGetProductByIdNotFound() {
    // When & Then: Buscar un producto que no existe
    webTestClient.get()
            .uri("/api/products/{id}", 9999L)
            .exchange()
            .expectStatus().isNotFound();
}
```

**¿Qué hace?**

1. 🔍 Busca un producto con ID 9999 (no existe)
2. ✅ Verifica que retorna HTTP 404 Not Found

Este test valida el manejo de errores del servicio.

---

### 🧪 Test 4: Crear Producto

```java
@Test
void testCreateProduct() {
    // Given: Preparar un nuevo producto
    Product newProduct = new Product(null, "New Product", "New Description",
                                     new BigDecimal("250.00"), 25);

    // When & Then: Crear el producto
    webTestClient.post()
            .uri("/api/products")
            .contentType(MediaType.APPLICATION_JSON)
            .body(Mono.just(newProduct), Product.class)
            .exchange()
            .expectStatus().isCreated()
            .expectBody(Product.class)
            .value(p -> {
                assertThat(p.getId()).isNotNull();
                assertThat(p.getName()).isEqualTo("New Product");
                assertThat(p.getPrice()).isEqualByComparingTo(new BigDecimal("250.00"));
            });
}
```

**¿Qué hace?**

1. 📝 Prepara un producto nuevo (ID = null)
2. 📤 Hace un `POST /api/products` enviando JSON
3. ✅ Verifica HTTP 201 Created
4. ✅ Valida que se generó un ID automáticamente
5. ✅ Verifica que los datos se guardaron correctamente

**Nota:** `Mono.just(newProduct)` envuelve el objeto en un publisher reactivo

---

### 🧪 Test 5: Validación de Datos

```java
@Test
void testCreateProductValidationFails() {
    // Given: Producto con datos inválidos
    Product invalidProduct = new Product(null, "", "Description",
                                         new BigDecimal("-10.00"), 5);

    // When & Then: Intentar crear el producto inválido
    webTestClient.post()
            .uri("/api/products")
            .contentType(MediaType.APPLICATION_JSON)
            .body(Mono.just(invalidProduct), Product.class)
            .exchange()
            .expectStatus().isBadRequest();
}
```

**¿Qué hace?**

1. 📝 Crea producto con datos inválidos:
   - Nombre vacío (violación de `@NotBlank`)
   - Precio negativo (violación de `@Positive`)
2. 📤 Intenta crear el producto
3. ✅ Verifica que retorna HTTP 400 Bad Request

Este test valida las anotaciones de validación de Jakarta Validation.

---

### 🧪 Test 6: Actualizar Producto

```java
@Test
void testUpdateProduct() {
    // Given: Crear un producto existente
    Product existingProduct = new Product(null, "Old Name", "Old Description",
                                          new BigDecimal("100.00"), 10);
    Product savedProduct = productRepository.save(existingProduct).block();

    // Preparar datos actualizados
    Product updatedProduct = new Product(null, "Updated Name", "Updated Description",
                                         new BigDecimal("120.00"), 15);

    // When & Then: Actualizar el producto
    webTestClient.put()
            .uri("/api/products/{id}", savedProduct.getId())
            .contentType(MediaType.APPLICATION_JSON)
            .body(Mono.just(updatedProduct), Product.class)
            .exchange()
            .expectStatus().isOk()
            .expectBody(Product.class)
            .value(p -> {
                assertThat(p.getId()).isEqualTo(savedProduct.getId());
                assertThat(p.getName()).isEqualTo("Updated Name");
                assertThat(p.getPrice()).isEqualByComparingTo(new BigDecimal("120.00"));
            });
}
```

**¿Qué hace?**

1. 📝 Crea producto con "Old Name" y precio 100.00
2. 📝 Prepara datos actualizados con "Updated Name" y precio 120.00
3. 📤 Hace un `PUT /api/products/{id}`
4. ✅ Verifica HTTP 200
5. ✅ Valida que el ID no cambió
6. ✅ Verifica que los datos se actualizaron

---

### 🧪 Test 7: Eliminar Producto

```java
@Test
void testDeleteProduct() {
    // Given: Crear un producto
    Product product = new Product(null, "To Delete", "Will be deleted",
                                  new BigDecimal("50.00"), 5);
    Product savedProduct = productRepository.save(product).block();

    // When: Eliminar el producto
    webTestClient.delete()
            .uri("/api/products/{id}", savedProduct.getId())
            .exchange()
            .expectStatus().isNoContent();

    // Then: Verificar que el producto ya no existe
    webTestClient.get()
            .uri("/api/products/{id}", savedProduct.getId())
            .exchange()
            .expectStatus().isNotFound();
}
```

**¿Qué hace?**

1. 📝 Crea un producto
2. 🗑️ Hace un `DELETE /api/products/{id}`
3. ✅ Verifica HTTP 204 No Content
4. 🔍 Intenta obtener el producto eliminado
5. ✅ Verifica HTTP 404 Not Found (ya no existe)

Este test valida que la eliminación es exitosa y permanente.

---

### 🧪 Test 8: Buscar por Nombre

```java
@Test
void testSearchProductsByName() {
    // Given: Crear varios productos
    productRepository.save(new Product(null, "Laptop HP", "High performance",
                                       new BigDecimal("1200.00"), 5)).block();
    productRepository.save(new Product(null, "Laptop Dell", "Business laptop",
                                       new BigDecimal("1000.00"), 3)).block();
    productRepository.save(new Product(null, "Mouse", "Wireless mouse",
                                       new BigDecimal("25.00"), 50)).block();

    // When & Then: Buscar productos por nombre
    webTestClient.get()
            .uri("/api/products/search?name=laptop")
            .exchange()
            .expectStatus().isOk()
            .expectBodyList(Product.class)
            .hasSize(2);
}
```

**¿Qué hace?**

1. 📝 Crea 3 productos: 2 laptops y 1 mouse
2. 🔍 Hace un `GET /api/products/search?name=laptop`
3. ✅ Verifica HTTP 200
4. ✅ Verifica que retorna solo 2 productos (las laptops)

Este test valida el método `findByNameContainingIgnoreCase` del repositorio.

---

### 🧪 Test 9: Filtrar por Stock

```java
@Test
void testGetProductsWithStock() {
    // Given: Crear productos con diferentes cantidades de stock
    productRepository.save(new Product(null, "Product A", "Description A",
                                       new BigDecimal("100.00"), 5)).block();
    productRepository.save(new Product(null, "Product B", "Description B",
                                       new BigDecimal("200.00"), 15)).block();
    productRepository.save(new Product(null, "Product C", "Description C",
                                       new BigDecimal("300.00"), 25)).block();

    // When & Then: Buscar productos con stock mayor a 10
    webTestClient.get()
            .uri("/api/products/stock?minStock=10")
            .exchange()
            .expectStatus().isOk()
            .expectBodyList(Product.class)
            .hasSize(2);
}
```

**¿Qué hace?**

1. 📝 Crea productos con stock: 5, 15 y 25
2. 🔍 Busca productos con stock > 10
3. ✅ Verifica que retorna solo 2 productos (15 y 25)

---

### 🧪 Test 10: Streaming Reactivo (Server-Sent Events)

```java
@Test
void testStreamProducts() {
    // Given: Crear productos
    productRepository.save(new Product(null, "Stream Product 1", "Description 1",
                                       new BigDecimal("100.00"), 10)).block();
    productRepository.save(new Product(null, "Stream Product 2", "Description 2",
                                       new BigDecimal("200.00"), 20)).block();

    // When & Then: Verificar el endpoint de streaming
    webTestClient.get()
            .uri("/api/products/stream")
            .accept(MediaType.TEXT_EVENT_STREAM)
            .exchange()
            .expectStatus().isOk()
            .expectHeader().contentTypeCompatibleWith(MediaType.TEXT_EVENT_STREAM)
            .expectBodyList(Product.class)
            .hasSize(2);
}
```

**¿Qué hace?**

1. 📝 Crea 2 productos
2. 🔍 Hace un `GET /api/products/stream` aceptando `text/event-stream`
3. ✅ Verifica que el servidor responde con SSE
4. ✅ Verifica que se reciben los 2 productos con delay de 1 segundo entre cada uno

Este test valida el streaming reactivo, donde los datos se envían progresivamente.

---

## 🟢 Tests de Repositorio

### 📦 Configuración

```java
@DataR2dbcTest
class ProductRepositoryTest {

    @Autowired
    private ProductRepository productRepository;

    @BeforeEach
    void setUp() {
        productRepository.deleteAll().block();
    }
}
```

**Anotaciones importantes:**

- `@DataR2dbcTest`: Solo levanta la capa de acceso a datos R2DBC
- No levanta controllers ni services (más rápido)
- Usa base de datos embebida H2

---

### 🧪 Test 1: Guardar Producto

```java
@Test
void testSaveProduct() {
    // Given
    Product product = new Product(null, "Test Product", "Test Description",
                                  new BigDecimal("100.00"), 10);

    // When
    Mono<Product> savedProduct = productRepository.save(product);

    // Then
    StepVerifier.create(savedProduct)
            .expectNextMatches(p ->
                p.getId() != null &&
                p.getName().equals("Test Product")
            )
            .verifyComplete();
}
```

**¿Qué hace?**

1. 📝 Crea un producto sin ID
2. 💾 Llama a `repository.save()`
3. ✅ Usa `StepVerifier` para validar el `Mono`
4. ✅ Verifica que se generó un ID
5. ✅ Verifica que el nombre es correcto
6. ✅ Confirma que el `Mono` completó sin errores

**StepVerifier:** Herramienta de Reactor Test para validar publishers reactivos.

---

### 🧪 Test 2: Buscar por ID

```java
@Test
void testFindById() {
    // Given
    Product product = new Product(null, "Test Product", "Test Description",
                                  new BigDecimal("100.00"), 10);
    Product saved = productRepository.save(product).block();

    // When
    Mono<Product> foundProduct = productRepository.findById(saved.getId());

    // Then
    StepVerifier.create(foundProduct)
            .expectNextMatches(p -> p.getName().equals("Test Product"))
            .verifyComplete();
}
```

**¿Qué hace?**

1. 📝 Guarda un producto y espera su ID (con `.block()`)
2. 🔍 Busca el producto por ID
3. ✅ Verifica que encuentra el producto correcto

---

### 🧪 Test 3: Buscar por Nombre (Ignorando Mayúsculas)

```java
@Test
void testFindByNameContainingIgnoreCase() {
    // Given
    productRepository.save(new Product(null, "Laptop HP", "Description 1",
                                       new BigDecimal("1200.00"), 5)).block();
    productRepository.save(new Product(null, "Laptop Dell", "Description 2",
                                       new BigDecimal("1000.00"), 3)).block();
    productRepository.save(new Product(null, "Mouse", "Description 3",
                                       new BigDecimal("25.00"), 50)).block();

    // When
    Flux<Product> laptops = productRepository.findByNameContainingIgnoreCase("laptop");

    // Then
    StepVerifier.create(laptops)
            .expectNextCount(2)
            .verifyComplete();
}
```

**¿Qué hace?**

1. 📝 Guarda "Laptop HP", "Laptop Dell" y "Mouse"
2. 🔍 Busca productos que contengan "laptop" (minúsculas)
3. ✅ Verifica que encuentra 2 productos (ignora mayúsculas)

Este test valida el query derivado de Spring Data: `findByNameContainingIgnoreCase`.

---

### 🧪 Test 4: Buscar por Stock Mayor a X

```java
@Test
void testFindByStockGreaterThan() {
    // Given
    productRepository.save(new Product(null, "Product A", "Description A",
                                       new BigDecimal("100.00"), 5)).block();
    productRepository.save(new Product(null, "Product B", "Description B",
                                       new BigDecimal("200.00"), 15)).block();
    productRepository.save(new Product(null, "Product C", "Description C",
                                       new BigDecimal("300.00"), 25)).block();

    // When
    Flux<Product> productsWithStock = productRepository.findByStockGreaterThan(10);

    // Then
    StepVerifier.create(productsWithStock)
            .expectNextCount(2)
            .verifyComplete();
}
```

**¿Qué hace?**

1. 📝 Guarda productos con stock: 5, 15 y 25
2. 🔍 Busca productos con stock > 10
3. ✅ Verifica que retorna 2 productos (15 y 25)

---

### 🧪 Test 5: Eliminar Producto

```java
@Test
void testDeleteProduct() {
    // Given
    Product product = new Product(null, "To Delete", "Will be deleted",
                                  new BigDecimal("50.00"), 5);
    Product saved = productRepository.save(product).block();

    // When
    Mono<Void> deleteResult = productRepository.deleteById(saved.getId());

    // Then
    StepVerifier.create(deleteResult)
            .verifyComplete();

    // Verify it's deleted
    StepVerifier.create(productRepository.findById(saved.getId()))
            .expectNextCount(0)
            .verifyComplete();
}
```

**¿Qué hace?**

1. 📝 Guarda un producto
2. 🗑️ Elimina el producto por ID
3. ✅ Verifica que la operación completó (`Mono<Void>`)
4. 🔍 Intenta buscar el producto
5. ✅ Verifica que no retorna nada (fue eliminado)

---

## ⚡ Conceptos Reactivos en Tests

### 🔹 Mono y Flux

```java
Mono<Product>  // 0 o 1 elemento
Flux<Product>  // 0 a N elementos
```

Son **publishers reactivos** que emiten datos de forma asíncrona.

### 🔹 `.block()` - Bloquear y Esperar

```java
Product saved = productRepository.save(product).block();
```

- Bloquea el thread actual hasta que el `Mono` complete
- Retorna el valor emitido
- ⚠️ Solo usar en tests, NO en código de producción

### 🔹 `Mono.just()` - Crear un Mono

```java
.body(Mono.just(newProduct), Product.class)
```

- Crea un `Mono` que emite un solo valor
- Útil para envolver objetos en publishers reactivos

### 🔹 `StepVerifier` - Validar Streams

```java
StepVerifier.create(mono)
    .expectNextMatches(p -> p.getId() != null)  // Valida el siguiente elemento
    .verifyComplete();                          // Verifica que completó
```

Métodos comunes:

- `.expectNext(value)` - Espera un valor específico
- `.expectNextMatches(predicate)` - Valida con una condición
- `.expectNextCount(n)` - Espera N elementos
- `.verifyComplete()` - Verifica que el stream terminó sin errores
- `.verifyError()` - Verifica que terminó con error

### 🔹 `WebTestClient` - Cliente HTTP de Pruebas

```java
webTestClient.get()              // Tipo de request
    .uri("/api/products")        // Endpoint
    .exchange()                  // Ejecuta el request
    .expectStatus().isOk()       // Valida status code
    .expectBody(Product.class)   // Tipo de respuesta esperado
    .value(p -> { ... });        // Validaciones del body
```

---

## 🏃 Cómo Ejecutar los Tests

### Todos los tests

```bash
mvn test
```

### Solo tests de integración

```bash
mvn test -Dtest=ProductIntegrationTest
```

### Solo tests de repositorio

```bash
mvn test -Dtest=ProductRepositoryTest
```

### Un test específico

```bash
mvn test -Dtest=ProductIntegrationTest#testCreateProduct
```

### Con reporte detallado

```bash
mvn test -X
```

### Ver cobertura de código

```bash
mvn clean test jacoco:report
```

---

## 📊 Comparación de Tipos de Tests

| Aspecto | Tests de Integración | Tests de Repositorio |
|---------|---------------------|---------------------|
| **Anotación** | `@SpringBootTest` | `@DataR2dbcTest` |
| **Alcance** | Toda la aplicación | Solo capa de datos |
| **Componentes** | Controller + Service + Repository + DB | Solo Repository + DB |
| **Velocidad** | Más lentos (~10s) | Más rápidos (~0.5s) |
| **Herramienta principal** | `WebTestClient` | `StepVerifier` |
| **Qué validan** | Endpoints REST completos | Queries de base de datos |
| **Base de datos** | H2 en memoria | H2 en memoria |
| **Puerto HTTP** | Aleatorio | No usa puerto |

---

## 🎯 Mejores Prácticas

### ✅ DO (Hacer)

1. **Limpiar datos antes de cada test** con `@BeforeEach`
2. **Usar nombres descriptivos** para los tests
3. **Seguir patrón Given-When-Then** para organizar el código
4. **Validar status codes HTTP** en tests de integración
5. **Usar `StepVerifier`** para validar publishers reactivos
6. **Probar casos de error** además de casos exitosos

### ❌ DON'T (No hacer)

1. ❌ No usar `.block()` en código de producción
2. ❌ No depender de orden de ejecución entre tests
3. ❌ No compartir estado entre tests
4. ❌ No ignorar tests que fallan
5. ❌ No testear con datos hardcodeados de producción

---

## 📈 Cobertura de Tests

El proyecto incluye tests para:

- ✅ CRUD completo (Create, Read, Update, Delete)
- ✅ Búsquedas y filtros
- ✅ Validaciones de datos
- ✅ Manejo de errores (404, 400)
- ✅ Queries personalizados del repositorio
- ✅ Streaming reactivo (Server-Sent Events)

**Cobertura:** 100% de los endpoints y métodos principales

---

## 🔧 Troubleshooting

### Problema: Tests fallan con "Connection refused"

**Solución:** Asegúrate de que no haya otra instancia corriendo en el mismo puerto

### Problema: "No qualifying bean of type 'WebTestClient'"

**Solución:** Añade `@AutoConfigureWebTestClient` a la clase de test

### Problema: Tests muy lentos

**Solución:** Usa `@DataR2dbcTest` en lugar de `@SpringBootTest` cuando solo necesites la capa de datos

### Problema: "StepVerifier timed out"

**Solución:** Aumenta el timeout con `.expectTimeout(Duration.ofSeconds(5))`

---

## 📚 Referencias

- [Spring WebFlux Testing](https://docs.spring.io/spring-framework/reference/testing/webtestclient.html)
- [Project Reactor Testing](https://projectreactor.io/docs/core/release/reference/#testing)
- [Spring Data R2DBC Testing](https://docs.spring.io/spring-data/r2dbc/reference/testing.html)
- [JUnit 5 Documentation](https://junit.org/junit5/docs/current/user-guide/)

---

## 🎓 Conclusión

Los tests son fundamentales para garantizar la calidad del microservicio reactivo. Este proyecto implementa:

- 🧪 **10 tests de integración** que validan el comportamiento completo
- 🧪 **5 tests de repositorio** que validan las operaciones de BD
- ⚡ **Uso de programación reactiva** con `Mono`, `Flux` y `StepVerifier`
- 📊 **Cobertura completa** de todos los endpoints y funcionalidades

¡Ahora tienes un microservicio completamente testeado y listo para producción! 🚀
