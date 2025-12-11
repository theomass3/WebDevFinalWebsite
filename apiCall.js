const list = document.getElementById('list')

const HARDCOVER_API_KEY = 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJIYXJkY292ZXIiLCJ2ZXJzaW9uIjoiOCIsImp0aSI6ImYwMzNkMzc2LTc5ZDUtNDkzNS05YTYzLTQ1OTFjOWZiZDM3MCIsImFwcGxpY2F0aW9uSWQiOjIsInN1YiI6IjU1OTczIiwiYXVkIjoiMSIsImlkIjoiNTU5NzMiLCJsb2dnZWRJbiI6dHJ1ZSwiaWF0IjoxNzYzODc3NDkxLCJleHAiOjE3OTU0MTM0OTEsImh0dHBzOi8vaGFzdXJhLmlvL2p3dC9jbGFpbXMiOnsieC1oYXN1cmEtYWxsb3dlZC1yb2xlcyI6WyJ1c2VyIl0sIngtaGFzdXJhLWRlZmF1bHQtcm9sZSI6InVzZXIiLCJ4LWhhc3VyYS1yb2xlIjoidXNlciIsIlgtaGFzdXJhLXVzZXItaWQiOiI1NTk3MyJ9LCJ1c2VyIjp7ImlkIjo1NTk3M319.VtISJ9upyqw3hD297WBN63ZxFxqdVF6Z-oVWuG5P3HY';

const query = `
{
  search(
          query: "little",
          query_type: "Book",
          per_page: 10,
          page: 1
      ) {
          results
      }
}`;

// Proxied, corrected request
const proxyUrl = 'https://corsproxy.io/?';
const hardcoverApiUrl = 'https://api.hardcover.app/v1/graphql';

// The corsproxy.io pattern requires URL-encoding the target URL
const proxiedUrl = proxyUrl + encodeURIComponent(hardcoverApiUrl);

if (true) {
    fetch(proxiedUrl, {
        headers: {
            'content-type': 'application/json',
            authorization: HARDCOVER_API_KEY,
        },
        body: JSON.stringify({ query }),
        method: 'POST',
    })
        .then((response) => response.json())
        .then(({ data }) => {
            let books = []
            data.search.results.hits.forEach(element => {
                if((element.document.ratings_count > 0) && (element.document.rating > 4))
                    books.push(element.document)
                    const bookEntry = document.createElement('li')
                    bookEntry.innerText = element.document.title + element.document.rating
                    list.appendChild(bookEntry)
                    console.log('added')
            });
            
            console.log(data.search.results.hits)
        });

}
