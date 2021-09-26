# jekyll-comments-google-forms

Files necessary to add commenting functionality to Jekyll sites using Google Sheets as storage.

See this article for more details: [Using Google Forms for Jekyll Comments, Revisited]

## Configuration Options

Images of all of these features can be seen in the article linked above.

### Adding to Jekyll

The baisc idea is to copy `comment-section.html` to your `_includes` folder in your Jekyll project.

Then use the following liquid statement on any page or layout template in which you want to add comments:

```liquid
{% include comment-section.html %}
```

Comments are stored with reference to the current page's url (via `page.url`), so if you have a page generated with comments and change the url later (adding a permalink or something), then it would not show the existing comments. You could update the Google Sheets to change the url though for existing commnets.

If you have some other id you want to use instead of `page.url`, update the following line inside `comment-section.html`:

```javascript
var thisPageUrl = "{{ page.url }}";
```

### Data Source

If using Google Sheets + Google Forms as described in the [original article], you should have the following items in your `_config.yml` file:

```yml
comment-read: https://docs.google.com/spreadsheets/d/xxxx
comment-post: https://docs.google.com/forms/d/e/xxxxxx
comment-post-fields: [ entry.1111111, entry.1111111, entry.1111111]
```
See [this article] if you need a refresher on how to get these values.

--

If using Google Sheets + Google Apps Script, you should have the following in your `_config.yml` file instead:
```yml
google_forms_comments:
  google_app_script: Apps Script URL
```
For a refresher on how to get your app's script URL, see the [Using Google Forms for Jekyll Comments, Revisited] article.

### Chunked Comments

This feature shows the user only 5 comments at a time. If there are more comments, a "Load Older Comments" button is displayed.

This feature is ON by default.

This feature can be enabled or disabled on a site-level and a page-level.

To enable/disable the feature for the entire site, update `_config.yml` with the following boolean item
```yml
google_forms_comments:
  chunked_comment_loading: false
```
To enable/disable this feature on a per-page basis, update the page's front-matter:
```
chunked_comment_loading: false
```

If the page's front-matter value for `chunked_comment_loading` differs from the configuration option mentioned in the base site config, the page's value will be used. Therefore, you can have a site with chunked comments off on all but a single page or vice versa.

### Lazy Loaded Comments

This feature waits to load any comments or scripts required for the comments (jQuery, jquery-csv, validator) until the user signifies that they actually want to read the comments.

This feature is OFF by default.

This feature can be enabled or disabled on a site-level and a page-level.

To enable/disable the feature for the entire site, update `_config.yml` with the following boolean item
```yml
google_forms_comments:
  lazy_load_comments: false
```
To enable/disable this feature on a per-page basis, update the page's front-matter:
```
lazy_load_comments: false
```

If the page's front-matter value for `lazy_load_comments` differs from the configuration option mentioned in the base site config, the page's value will be used. Therefore, you can have a lazy loaded comments an all but a single page or vice versa.

### reCAPTCHA

This feature can be enabled when using the Google Sheets + Google Apps Script. 

After adding the relevent secret key to the Google Apps Script `RECAPTCHA_SECRET_KEY` variable, the Jekyll site's `_config.yml` should have the site key added in the following variable:
```yml
google_forms_comments:
  recaptcha_site_key: Site Key Here
```

For more specific details on setup required, please see the reCAPTCHA section of [Using Google Forms for Jekyll Comments, Revisited]


[Using Google Forms for Jekyll Comments, Revisited]: https://jdvp.me/articles/Google-Forms-Jekyll-Comments-Revisited
[original article]: https://jdvp.me/articles/Google-Forms-Jekyll-Comments
[this article]: https://jdvp.me/articles/Google-Forms-Jekyll-Comments
