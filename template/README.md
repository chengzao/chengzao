## about repo 👋

- repo: {{ url }}

- bio: {{ bio }}

- repositories: {{ totalCount }}

## latest updated

{{each nodes}}

- [{{$value.name}}]({{$value.url}}) : {{$value.updatedAt}}

{{/each}}
