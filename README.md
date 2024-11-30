# campus-connect

App

# Sanitización Automática de Texto en PostgreSQL

Este proyecto implementa la sanitización automática de texto en las tablas `posts` y `comments` de una base de datos PostgreSQL. La sanitización incluye:

1. Reemplazo de palabras ofensivas con `****`.
2. Escape de caracteres peligrosos (`<` y `>`) para prevenir ataques XSS.

## Estructura del Proyecto

### 1. Función General de Sanitización

La función `sanitize_text` centraliza la lógica de sanitización. Esta función:
- Reemplaza palabras ofensivas definidas en una lista.
- Escapa etiquetas HTML para prevenir inyecciones maliciosas.

```sql
CREATE OR REPLACE FUNCTION sanitize_text(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  input_text := regexp_replace(input_text, '(badword1|badword2|badword3)', '****', 'gi');

  input_text := replace(replace(input_text, '<', '&lt;'), '>', '&gt;');

  RETURN input_text;
END;
$$ LANGUAGE plpgsql;
```

### 2. Función de Sanitización para la Tabla `posts`

La función `sanitize_posts_function` se encarga de sanitizar el texto en la columna `description` de la tabla `posts`. Esta función utiliza `sanitize_text` para:

- Reemplazar palabras ofensivas definidas en una lista.
- Escapar etiquetas HTML para prevenir inyecciones maliciosas.

```sql
CREATE OR REPLACE FUNCTION sanitize_posts_function()
RETURNS TRIGGER AS $$
BEGIN
  NEW.description := sanitize_text(NEW.description);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
``` 
### 3. Función de Sanitización para la Tabla `comments`

La función `sanitize_comments_function` se encarga de sanitizar el texto en la columna `content` de la tabla `comments`. Esta función utiliza `sanitize_text` para:

- Reemplazar palabras ofensivas definidas en una lista.
- Escapar etiquetas HTML para prevenir inyecciones maliciosas.

```sql
CREATE OR REPLACE FUNCTION sanitize_comments_function()
RETURNS TRIGGER AS $$
BEGIN
  NEW.content := sanitize_text(NEW.content);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 4. Trigger para la Tabla `posts`

El trigger `sanitize_posts_trigger` se encarga de ejecutar la función `sanitize_posts_function` antes de cada inserción o actualización en la tabla `posts`. Esto asegura que el texto en la columna `description` sea sanitizado automáticamente.

```sql
CREATE TRIGGER sanitize_posts_trigger
BEFORE INSERT OR UPDATE ON posts
FOR EACH ROW
EXECUTE FUNCTION sanitize_posts_function();
```

### 5. Trigger para la Tabla `comments`

El trigger `sanitize_comments_trigger` se encarga de ejecutar la función `sanitize_comments_function` antes de cada inserción o actualización en la tabla `comments`. Esto asegura que el texto en la columna `content` sea sanitizado automáticamente.

```sql
CREATE TRIGGER sanitize_comments_trigger
BEFORE INSERT OR UPDATE ON comments
FOR EACH ROW
EXECUTE FUNCTION sanitize_comments_function();
```
